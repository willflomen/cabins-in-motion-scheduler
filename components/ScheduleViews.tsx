import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Button } from './ui/button'
import { Save } from 'lucide-react'
import type { Schedule, ActivityGrouping, CabinGrouping } from '../types'

interface ScheduleViewsProps {
  schedule: Schedule
  onSave: (viewType: 'rounds' | 'activities' | 'cabins') => void
}

export const ScheduleViews: React.FC<ScheduleViewsProps> = ({ schedule, onSave }) => {
  // Transform schedule data for different views
  const byActivities = schedule.reduce<ActivityGrouping>((acc, round) => {
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

  const byCabins = schedule.reduce<CabinGrouping>((acc, round) => {
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

  return (
    <Tabs defaultValue="rounds" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="rounds">By Rounds</TabsTrigger>
        <TabsTrigger value="activities">By Activities</TabsTrigger>
        <TabsTrigger value="cabins">By Cabins</TabsTrigger>
      </TabsList>

      <TabsContent value="rounds" className="space-y-6">
        {schedule.map((round) => (
          <div 
            key={round.round}
            className="border rounded-lg p-4 space-y-3"
          >
            <h3 className="font-medium">Round {round.round}</h3>
            <div className="space-y-2">
              {round.pairings.map((pair, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 p-3 rounded-md flex justify-between items-center hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-blue-600">
                    {pair.activity}
                  </span>
                  <span>
                    {pair.cabin1} vs {pair.cabin2}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <Button 
          className="w-full hover:bg-gray-100"
          onClick={() => onSave('rounds')}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Rounds View
        </Button>
      </TabsContent>

      <TabsContent value="activities" className="space-y-6">
        {Object.entries(byActivities).map(([activity, matches]) => (
          <div 
            key={activity}
            className="border rounded-lg p-4 space-y-3"
          >
            <h3 className="font-medium">{activity}</h3>
            <div className="space-y-2">
              {matches.map((match, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 p-3 rounded-md flex justify-between items-center hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-blue-600">
                    Round {match.round}
                  </span>
                  <span>
                    {match.cabin1} vs {match.cabin2}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <Button 
          className="w-full hover:bg-gray-100"
          onClick={() => onSave('activities')}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Activities View
        </Button>
      </TabsContent>

      <TabsContent value="cabins" className="space-y-6">
        {Object.entries(byCabins).map(([cabin, matches]) => (
          <div 
            key={cabin}
            className="border rounded-lg p-4 space-y-3"
          >
            <h3 className="font-medium">{cabin}</h3>
            <div className="space-y-2">
              {matches.map((match, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 p-3 rounded-md flex justify-between items-center hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-blue-600">
                    Round {match.round}: {match.activity}
                  </span>
                  <span>
                    vs {match.opponent}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <Button 
          className="w-full hover:bg-gray-100"
          onClick={() => onSave('cabins')}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Cabins View
        </Button>
      </TabsContent>
    </Tabs>
  )
}