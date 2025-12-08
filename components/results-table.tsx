import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ClassificationResult {
  student_labels: {
    tables: Array<{
      activity: string
      HCD_Spaces: string[]
      HCD_Subspaces: string[]
    }>
  }
  llm_labels: Array<{
    activity: string
    HCD_Spaces: string[]
    HCD_Subspaces: string[]
  }>
  final_labels: {
    labels: Array<{
      activity: string
      student_labeled_spaces: string[]
      student_labeled_subspaces: string[]
      result: number
      Reason: string
    }>
  }
}

const HCD_SUBSPACES = [
  "Explore",
  "Observe",
  "Empathize",
  "Reflect",
  "Debrief",
  "Organize",
  "Interpret",
  "Define",
  "Brainstorm",
  "Propose",
  "Plan",
  "Narrow Concepts",
  "Create",
  "Engage",
  "Evaluate",
  "Iterate",
  "Support",
  "Sustain",
  "Evolve",
  "Execute",
]

interface ResultsTableProps {
  result: ClassificationResult
}

export default function ResultsTable({ result }: ResultsTableProps) {
  const subspaceResults = new Map<string, number>()

  // Process all labels to find the worst result for each subspace
  result.final_labels.labels.forEach((label) => {
    const subspaces = label.student_labeled_subspaces

    subspaces.forEach((subspace) => {
      // Find matching subspace from HCD_SUBSPACES (case-insensitive)
      const matchingSubspace = HCD_SUBSPACES.find((s) => s.toLowerCase() === subspace.toLowerCase())

      if (matchingSubspace) {
        const currentWorst = subspaceResults.get(matchingSubspace) ?? 1
        // -1 is worst, 0 is middle, 1 is best
        if (label.result < currentWorst) {
          subspaceResults.set(matchingSubspace, label.result)
        }
      }
    })
  })

  // Get color class based on result value
  const getColorClass = (value: number | undefined) => {
    if (value === undefined) return "bg-background"
    if (value === 1) return "bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100"
    if (value === 0) return "bg-yellow-100 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100"
    if (value === -1) return "bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100"
    return "bg-background"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Classification Results</CardTitle>
          <CardDescription>HCD Subspace classification results (Green = 1, Yellow = 0, Red = -1)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">HCD Subspace</TableHead>
                  <TableHead className="font-semibold">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {HCD_SUBSPACES.map((subspace) => {
                  const resultValue = subspaceResults.get(subspace)
                  return (
                    <TableRow key={subspace}>
                      <TableCell className="font-medium">{subspace}</TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex rounded-md px-3 py-1 text-sm font-medium ${getColorClass(resultValue)}`}
                        >
                          {resultValue !== undefined ? resultValue : ""}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Activity Labels</CardTitle>
          <CardDescription>Complete classification details for each activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.final_labels.labels.map((label, index) => (
              <div key={index} className="rounded-lg border border-border bg-card p-4 text-card-foreground">
                <div className="mb-2 flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-foreground">{label.activity}</h3>
                  <div className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${getColorClass(label.result)}`}>
                    {label.result}
                  </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium">Spaces:</span> {label.student_labeled_spaces.join(", ")}
                  </p>
                  <p>
                    <span className="font-medium">Subspaces:</span> {label.student_labeled_subspaces.join(", ")}
                  </p>
                  <p>
                    <span className="font-medium">Reason:</span> {label.Reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
