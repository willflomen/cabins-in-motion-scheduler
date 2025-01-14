export interface Pairing {
  activity: string
  cabin1: string
  cabin2: string
}

export interface Round {
  round: number
  pairings: Pairing[]
}

export interface Schedule extends Array<Round> {}

export interface ActivityMatch {
  round: number
  cabin1: string
  cabin2: string
}

export interface CabinMatch {
  round: number
  activity: string
  opponent: string
}

export interface PairingCounts {
  [key: string]: {
    count: number
    encounters: {
      round: number
      activity: string
    }[]
  }
}

export interface RepeatedPairing {
  cabin1: string
  cabin2: string
  count: number
  encounters: {
    round: number
    activity: string
  }[]
}

export interface GeneratedSchedule {
  schedule: Schedule
  repeatedPairings: RepeatedPairing[]
  hasRepeats: boolean
}

export interface ActivityGrouping {
  [activity: string]: ActivityMatch[]
}

export interface CabinGrouping {
  [cabin: string]: CabinMatch[]
}