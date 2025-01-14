'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ArrowRight, Loader2, Save, Plus, Trash2 } from 'lucide-react'
import { CampScheduler } from '../lib/scheduler'
import { ScheduleViews } from './ScheduleViews'
import type { Schedule } from '../types'

export const CampSchedulerApp = () => {
  const [step, _setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [activeTab, setActiveTab] = useState('input')

  // Form states
  const [formData, setFormData] = useState({
    activities: [] as string[],
    cabins: [] as string[],
    rounds: ''
  })

  const handleAddActivity = () => {
    setFormData(prev => ({
      ...prev,
      activities: [...prev.activities, '']
    }))
  }

  const handleAddCabin = () => {
    setFormData(prev => ({
      ...prev,
      cabins: [...prev.cabins, '']
    }))
  }

  const handleRemoveActivity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }))
  }

  const handleRemoveCabin = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cabins: prev.cabins.filter((_, i) => i !== index)
    }))
  }

  const handleActivityChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.map((item, i) => i === index ? value : item)
    }))
  }

  const handleCabinChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      cabins: prev.cabins.map((item, i) => i === index ? value : item)
    }))
  }

  const validateAndGenerateSchedule = async () => {
    setError('')

    if (formData.activities.length === 0) {
      setError('Please add at least one activity')
      return
    }

    if (formData.cabins.length === 0) {
      setError('Please add at least one cabin')
      return
    }

    if (formData.cabins.length % 2 !== 0) {
      setError('Number of cabins must be even')
      return
    }

    if (!formData.rounds || parseInt(formData.rounds) < 1) {
      setError('Please enter a valid number of rounds')
      return
    }

    if (new Set(formData.activities).size !== formData.activities.length) {
      setError('Activity names must be unique')
      return
    }

    if (new Set(formData.cabins).size !== formData.cabins.length) {
      setError('Cabin names must be unique')
      return
    }

    if (formData.activities.some(a => !a.trim())) {
      setError('All activities must have names')
      return
    }

    if (formData.cabins.some(c => !c.trim())) {
      setError('All cabins must have names')
      return
    }

    setLoading(true)
    try {
      const scheduler = new CampScheduler(
        formData.activities,
        parseInt(formData.rounds),
        formData.cabins
      )
      
      const generatedSchedule = scheduler.generateSchedule()
      
      if (generatedSchedule) {
        setSchedule(generatedSchedule.schedule)
        setActiveTab('schedule')

        // Display repeated pairings information
        if (generatedSchedule.repeatedPairings.length > 0) {
          const repeatInfo = generatedSchedule.repeatedPairings.map(pairing => {
            const encounters = pairing.encounters.map(e => 
              `Round ${e.round} (${e.activity})`
            ).join(', ')
            return `${pairing.cabin1} vs ${pairing.cabin2} compete ${pairing.count} times: ${encounters}`
          }).join('\n')
          
          console.log('Repeated Pairings Analysis:\n' + repeatInfo)
          setError(`Note: Schedule generated with ${generatedSchedule.repeatedPairings.length} repeated cabin pairings. Check console for details.`)
        }
      } else {
        setError('Could not generate a valid schedule with these parameters. Try reducing the number of rounds or increasing the number of activities.')
      }
    } catch (err) {
      setError('An error occurred while generating the schedule.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSchedule = (viewType: 'rounds' | 'activities' | 'cabins') => {
    if (!schedule) return

    let scheduleText = "Camp Activity Schedule\n\n"
    
    if (viewType === 'rounds') {
      schedule.forEach((round) => {
        scheduleText += `Round ${round.round}\n`
        round.pairings.forEach((pair) => {
          scheduleText += `${pair.activity}: ${pair.cabin1} vs ${pair.cabin2}\n`
        })
        scheduleText += "\n"
      })
    } 
    else if (viewType === 'activities') {
      const byActivities = schedule.reduce((acc: any, round) => {
        round.pairings.forEach((pair) => {
          if (!acc[pair.activity]) {
            acc[pair.activity] = []
          }
          acc[pair.activity].push({
            round: round.round,
            cabin1: pair.cabin1,
            cabin2: pair.cabin2
          })
        })
        return acc
      }, {})

      Object.entries(byActivities).forEach(([activity, rounds]: [string, any]) => {
        scheduleText += `${activity}\n`
        rounds.forEach((match: any) => {
          scheduleText += `Round ${match.round}: ${match.cabin1} vs ${match.cabin2}\n`
        })
        scheduleText += "\n"
      })
    }
    else if (viewType === 'cabins') {
      const byCabins = schedule.reduce((acc: any, round) => {
        round.pairings.forEach((pair) => {
          [pair.cabin1, pair.cabin2].forEach(cabin => {
            if (!acc[cabin]) {
              acc[cabin] = []
            }
            acc[cabin].push({
              round: round.round,
              activity: pair.activity,
              opponent: cabin === pair.cabin1 ? pair.cabin2 : pair.cabin1
            })
          })
        })
        return acc
      }, {})

      Object.entries(byCabins).forEach(([cabin, matches]: [string, any]) => {
        scheduleText += `${cabin}\n`
        matches.forEach((match: any) => {
          scheduleText += `Round ${match.round}: ${match.activity} vs ${match.opponent}\n`
        })
        scheduleText += "\n"
      })
    }

    const blob = new Blob([scheduleText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `camp_schedule_${viewType}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Camp Activity Scheduler</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">Input Data</TabsTrigger>
            <TabsTrigger value="schedule" disabled={!schedule}>
              View Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-8">
            {/* Activities Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Activities</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddActivity}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </div>
              <div className="space-y-2">
                {formData.activities.map((activity, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={activity}
                      onChange={(e) => handleActivityChange(index, e.target.value)}
                      placeholder={`Activity ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveActivity(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cabins Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Cabins</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddCabin}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cabin
                </Button>
              </div>
              <div className="space-y-2">
                {formData.cabins.map((cabin, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={cabin}
                      onChange={(e) => handleCabinChange(index, e.target.value)}
                      placeholder={`Cabin ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCabin(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Rounds Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Rounds</label>
              <Input
                type="number"
                min="1"
                value={formData.rounds}
                onChange={(e) => setFormData(prev => ({ ...prev, rounds: e.target.value }))}
                placeholder="Enter number of rounds"
              />
            </div>

            <Button 
              className="w-full hover:bg-gray-100 transition-all bg-white border border-gray-200"
              onClick={validateAndGenerateSchedule}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Schedule
                </>
              ) : (
                <>
                  Generate Schedule
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="schedule" data-value="schedule">
            {schedule && (
              <ScheduleViews 
                schedule={schedule} 
                onSave={handleSaveSchedule}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}