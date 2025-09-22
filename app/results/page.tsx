import ParticipantResultsDisplay from "@/components/participant-results-display"

export default function ResultsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Competition Results</h1>
        <p className="text-gray-600">
          Complete participant results with rankings, times, and points earned across all events.
        </p>
      </div>

      <ParticipantResultsDisplay />
    </div>
  )
}
