export class CampScheduler {
    private activities: string[]
    private numActivities: number
    private numRounds: number
    private cabins: string[]
    private numCabins: number
    private schedule: { [key: number]: [number, [number, number]][] }
  
    constructor(activities: string[], numRounds: number, cabins: string[]) {
      this.activities = activities
      this.numActivities = activities.length
      this.numRounds = numRounds
      this.cabins = cabins
      this.numCabins = cabins.length
      this.schedule = {}
      for (let i = 0; i < numRounds; i++) {
        this.schedule[i] = []
      }
    }
  
    private isValidPairing(roundNum: number, activity: number, cabin1: number, cabin2: number): boolean {
      // Check if either cabin is already in this round
      for (const [act, [c1, c2]] of this.schedule[roundNum]) {
        if (cabin1 === c1 || cabin1 === c2 || cabin2 === c1 || cabin2 === c2) {
          return false
        }
      }
  
      // Check if this activity is already used in this round
      for (const [act, [c1, c2]] of this.schedule[roundNum]) {
        if (act === activity) {
          return false
        }
      }
  
      // Check previous rounds
      for (const round in this.schedule) {
        for (const [act, [c1, c2]] of this.schedule[round]) {
          // Check if either cabin has already done this activity
          if (act === activity && (cabin1 === c1 || cabin1 === c2 || cabin2 === c1 || cabin2 === c2)) {
            return false
          }
          // Check if these cabins have already competed
          if ((cabin1 === c1 && cabin2 === c2) || (cabin1 === c2 && cabin2 === c1)) {
            return false
          }
        }
      }
      return true
    }
  
    private getUnusedActivities(roundNum: number): number[] {
      const usedActivities = new Set<number>()
      for (const [activity, _] of this.schedule[roundNum]) {
        usedActivities.add(activity)
      }
      return Array.from(Array(this.numActivities).keys())
        .filter(a => !usedActivities.has(a))
    }
  
    generateSchedule() {
      const backtrack = (roundNum: number): boolean => {
        if (roundNum === this.numRounds) {
          return true
        }
  
        // Get available cabins for this round
        const usedCabins = new Set<number>()
        for (const [_, [c1, c2]] of this.schedule[roundNum]) {
          usedCabins.add(c1)
          usedCabins.add(c2)
        }
        const availableCabins: number[] = []
        for (let i = 0; i < this.numCabins; i++) {
          if (!usedCabins.has(i)) {
            availableCabins.push(i)
          }
        }
  
        // If we've paired all cabins in this round, move to next round
        if (availableCabins.length === 0) {
          return backtrack(roundNum + 1)
        }
  
        const cabin1 = availableCabins[0]
        for (let j = 1; j < availableCabins.length; j++) {
          const cabin2 = availableCabins[j]
          
          // Get available activities for this round
          const availableActivities = this.getUnusedActivities(roundNum)
          
          for (const activity of availableActivities) {
            if (this.isValidPairing(roundNum, activity, cabin1, cabin2)) {
              this.schedule[roundNum].push([activity, [cabin1, cabin2]])
  
              if (backtrack(roundNum)) {
                return true
              }
  
              this.schedule[roundNum].pop()
            }
          }
        }
        return false
      }
  
      const success = backtrack(0)
      
      if (success) {
        // Convert schedule to more readable format
        return Object.entries(this.schedule).map(([round, pairings]) => ({
          round: parseInt(round) + 1,
          pairings: pairings.map(([activity, [cabin1, cabin2]]) => ({
            activity: this.activities[activity],
            cabin1: this.cabins[cabin1],
            cabin2: this.cabins[cabin2]
          }))
        }))
      }
      return null
    }
  }