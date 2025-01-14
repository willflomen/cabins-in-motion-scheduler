import type { GeneratedSchedule } from '../types'

export class CampScheduler {
  private activities: string[]
  private numActivities: number
  private numRounds: number
  private cabins: string[]
  private numCabins: number
  private schedule: { [key: number]: [number, [number, number]][] }
  private enableRepeats: boolean

  constructor(activities: string[], numRounds: number, cabins: string[]) {
    this.activities = activities
    this.numActivities = activities.length
    this.numRounds = numRounds
    this.cabins = cabins
    this.numCabins = cabins.length
    this.schedule = {}
    this.enableRepeats = false
    for (let i = 0; i < numRounds; i++) {
      this.schedule[i] = []
    }
  }

  private isValidPairing(roundNum: number, activity: number, cabin1: number, cabin2: number): boolean {
    // Check if either cabin is already in this round
    for (const [, [c1Pat, c2Pat]] of this.schedule[roundNum]) {
      if (cabin1 === c1Pat || cabin1 === c2Pat || cabin2 === c1Pat || cabin2 === c2Pat) {
        return false
      }
    }

    // Check if this activity is already used in this round
    for (const [currentAct] of this.schedule[roundNum]) {
      if (currentAct === activity) {
        return false
      }
    }

    // Check previous rounds
    for (const round in this.schedule) {
      for (const [currentAct, [c1Pat, c2Pat]] of this.schedule[round]) {
        // Check if either cabin has already done this activity
        if (currentAct === activity && 
            (cabin1 === c1Pat || cabin1 === c2Pat || cabin2 === c1Pat || cabin2 === c2Pat)) {
          return false
        }
        // Check if these cabins have already competed (only if repeats are not enabled)
        if (!this.enableRepeats && 
            ((cabin1 === c1Pat && cabin2 === c2Pat) || (cabin1 === c2Pat && cabin2 === c1Pat))) {
          return false
        }
      }
    }

    return true
  }

  generateSchedule(): GeneratedSchedule | null {
    // First try without allowing repeats
    this.enableRepeats = false
    let success = this.tryGenerateSchedule()

    // If no solution found, try with repeats enabled
    if (!success) {
      this.enableRepeats = true
      success = this.tryGenerateSchedule()
    }

    if (success) {
      // Convert schedule to more readable format and collect statistics
      const repeatedPairings: { 
        cabin1: string
        cabin2: string
        count: number
        encounters: { round: number; activity: string }[]
      }[] = []

      const pairingCounts = new Map<string, {
        count: number
        encounters: { round: number; activity: string }[]
      }>()

      // Analyze pairings
      Object.entries(this.schedule).forEach(([round, pairings]) => {
        pairings.forEach(([activity, [c1, c2]]) => {
          const pairingKey = [c1, c2].sort().join('-')
          if (!pairingCounts.has(pairingKey)) {
            pairingCounts.set(pairingKey, { count: 0, encounters: [] })
          }
          const details = pairingCounts.get(pairingKey)!
          details.count++
          details.encounters.push({
            round: parseInt(round) + 1,
            activity: this.activities[activity]
          })
        })
      })

      // Collect repeat information
      pairingCounts.forEach((details, key) => {
        if (details.count > 1) {
          const [c1, c2] = key.split('-').map(Number)
          repeatedPairings.push({
            cabin1: this.cabins[c1],
            cabin2: this.cabins[c2],
            count: details.count,
            encounters: details.encounters
          })
        }
      })

      return {
        schedule: Object.entries(this.schedule).map(([round, pairings]) => ({
          round: parseInt(round) + 1,
          pairings: pairings.map(([activity, [cabin1, cabin2]]) => ({
            activity: this.activities[activity],
            cabin1: this.cabins[cabin1],
            cabin2: this.cabins[cabin2]
          }))
        })),
        repeatedPairings,
        hasRepeats: this.enableRepeats
      }
    }

    return null
  }

  private tryGenerateSchedule(): boolean {
    const backtrack = (roundNum: number): boolean => {
      if (roundNum === this.numRounds) {
        return true
      }

      // Get available cabins for this round
      const usedCabins = new Set<number>()
      for (const [, [c1, c2]] of this.schedule[roundNum]) {
        usedCabins.add(c1)
        usedCabins.add(c2)
      }
      const availableCabins = []
      for (let i = 0; i < this.numCabins; i++) {
        if (!usedCabins.has(i)) {
          availableCabins.push(i)
        }
      }

      // Try all possible cabin pairs
      for (let i = 0; i < availableCabins.length; i++) {
        for (let j = i + 1; j < availableCabins.length; j++) {
          const cabin1 = availableCabins[i]
          const cabin2 = availableCabins[j]
          
          // Try each activity
          for (let activity = 0; activity < this.numActivities; activity++) {
            if (this.isValidPairing(roundNum, activity, cabin1, cabin2)) {
              this.schedule[roundNum].push([activity, [cabin1, cabin2]])

              if (this.schedule[roundNum].length * 2 === this.numCabins) {
                if (backtrack(roundNum + 1)) {
                  return true
                }
              } else if (backtrack(roundNum)) {
                return true
              }

              this.schedule[roundNum].pop()
            }
          }
        }
      }
      return false
    }

    // Reset schedule before attempting
    for (let i = 0; i < this.numRounds; i++) {
      this.schedule[i] = []
    }

    return backtrack(0)
  }
}
