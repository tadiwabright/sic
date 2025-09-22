// Scoring logic for swimming competition
// Points: 1st=4pts, 2nd=3pts, 3rd=2pts, 4th=1pt, 5th-8th=0pts

interface ResultInput {
  swimmer_id: number
  time_seconds: number | null
  status: "completed" | "disqualified" | "did_not_start" | "did_not_finish"
}

interface ResultWithScoring extends ResultInput {
  position: number | null
  points: number
}

export function calculatePositionsAndPoints(results: ResultInput[]): ResultWithScoring[] {
  // Separate completed results from others
  const completedResults = results.filter((r) => r.status === "completed" && r.time_seconds !== null)
  const otherResults = results.filter((r) => r.status !== "completed" || r.time_seconds === null)

  // Sort completed results by time (fastest first)
  completedResults.sort((a, b) => (a.time_seconds || 0) - (b.time_seconds || 0))

  // Handle ties and assign positions
  const resultsWithPositions: ResultWithScoring[] = []
  let currentPosition = 1

  for (let i = 0; i < completedResults.length; i++) {
    const result = completedResults[i]
    let position = currentPosition
    let tiedCount = 1

    // Check for ties (same time)
    if (i > 0 && result.time_seconds === completedResults[i - 1].time_seconds) {
      // This swimmer has the same time as the previous one
      position = resultsWithPositions[resultsWithPositions.length - 1].position!
    } else {
      // Count how many swimmers have this same time
      for (let j = i + 1; j < completedResults.length; j++) {
        if (completedResults[j].time_seconds === result.time_seconds) {
          tiedCount++
        } else {
          break
        }
      }
    }

    // Calculate points based on position
    const points = calculatePoints(position)

    resultsWithPositions.push({
      ...result,
      position,
      points,
    })

    // Update current position for next iteration
    if (i === 0 || result.time_seconds !== completedResults[i - 1].time_seconds) {
      currentPosition = i + tiedCount + 1
    }
  }

  // Add non-completed results with no position or points
  const otherResultsWithScoring: ResultWithScoring[] = otherResults.map((result) => ({
    ...result,
    position: null,
    points: 0,
  }))

  return [...resultsWithPositions, ...otherResultsWithScoring]
}

function calculatePoints(position: number): number {
  switch (position) {
    case 1:
      return 4
    case 2:
      return 3
    case 3:
      return 2
    case 4:
      return 1
    default:
      return 0 // 5th place and below get 0 points
  }
}

// Example usage and test cases
export function testScoringLogic() {
  console.log("Testing scoring logic...")

  // Test case 1: Normal race with no ties
  const test1 = [
    { swimmer_id: 1, time_seconds: 65.23, status: "completed" as const },
    { swimmer_id: 2, time_seconds: 67.45, status: "completed" as const },
    { swimmer_id: 3, time_seconds: 69.12, status: "completed" as const },
    { swimmer_id: 4, time_seconds: 71.88, status: "completed" as const },
    { swimmer_id: 5, time_seconds: 73.45, status: "completed" as const },
  ]

  const result1 = calculatePositionsAndPoints(test1)
  console.log("Test 1 (No ties):", result1)

  // Test case 2: Race with ties
  const test2 = [
    { swimmer_id: 1, time_seconds: 65.23, status: "completed" as const },
    { swimmer_id: 2, time_seconds: 65.23, status: "completed" as const }, // Tie for 1st
    { swimmer_id: 3, time_seconds: 69.12, status: "completed" as const },
    { swimmer_id: 4, time_seconds: 69.12, status: "completed" as const }, // Tie for 3rd
    { swimmer_id: 5, time_seconds: 73.45, status: "completed" as const },
  ]

  const result2 = calculatePositionsAndPoints(test2)
  console.log("Test 2 (With ties):", result2)

  // Test case 3: Race with disqualifications
  const test3 = [
    { swimmer_id: 1, time_seconds: 65.23, status: "completed" as const },
    { swimmer_id: 2, time_seconds: null, status: "disqualified" as const },
    { swimmer_id: 3, time_seconds: 69.12, status: "completed" as const },
    { swimmer_id: 4, time_seconds: null, status: "did_not_start" as const },
  ]

  const result3 = calculatePositionsAndPoints(test3)
  console.log("Test 3 (With DQ/DNS):", result3)
}
