"use client"

import { useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import html2canvas from "html2canvas"

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
      result: number[]
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

interface MultiResultsTableProps {
  results: { week: number; result: ClassificationResult }[]
}

export default function MultiResultsTable({ results }: MultiResultsTableProps) {
  const tableRef = useRef<HTMLTableElement>(null)

  // Process results for each week
  const weekResults = results.map(({ week, result }) => {
    const subspaceResults = new Map<string, number>()

    result.final_labels.labels.forEach((label) => {
      const subspaces = label.student_labeled_subspaces

      subspaces.forEach((subspace, idx) => {
        const matchingSubspace = HCD_SUBSPACES.find((s) => s.toLowerCase() === subspace.toLowerCase())

        if (matchingSubspace) {
          const value = label.result?.[idx]
          if (typeof value === "number") {
            const currentWorst = subspaceResults.get(matchingSubspace)
            if (currentWorst === undefined) {
              subspaceResults.set(matchingSubspace, value)
            } else {
              subspaceResults.set(matchingSubspace, Math.min(currentWorst, value))
            }
          }
        }
      })
    })

    return { week, subspaceResults }
  })

  // Get color class based on result value
  const getColorClass = (value: number | undefined) => {
    if (value === undefined) return ""
    if (value === 1) return "bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100"
    if (value === 0) return "bg-yellow-100 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100"
    if (value === -1) return "bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100"
    return ""
  }

  const exportToPNG = async () => {
    const el = tableRef.current
    if (!el) return

    try {
      const width = el.scrollWidth
      const height = el.scrollHeight

      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: 2,
        width,
        height,
        windowWidth: width,
        windowHeight: height,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        onclone: (doc) => {
          try {
            doc.documentElement.classList.remove("dark")
            doc.body.style.backgroundColor = "#ffffff"

            const style = doc.createElement("style")
            style.setAttribute("data-export-overrides", "")
            style.textContent = `
              /* Force simple RGB colors to avoid lab/oklch parsing */
              .bg-green-100 { background-color: #dcfce7 !important; }
              .text-green-900 { color: #14532d !important; }
              .dark .text-green-100, .text-green-100 { color: #ecfdf5 !important; }

              .bg-yellow-100 { background-color: #fef9c3 !important; }
              .text-yellow-900 { color: #713f12 !important; }
              .dark .text-yellow-100, .text-yellow-100 { color: #fef9c3 !important; }

              .bg-red-100 { background-color: #fee2e2 !important; }
              .text-red-900 { color: #7f1d1d !important; }
              .dark .text-red-100, .text-red-100 { color: #fee2e2 !important; }

              /* Basic surface tokens */
              body, html { background: #ffffff !important; }
              .bg-card { background-color: #ffffff !important; }
              .text-card-foreground { color: #0a0a0a !important; }
              .border-border { border-color: #e5e7eb !important; }
            `
            doc.head.appendChild(style)
          } catch (e) {
            // no-op
          }
        },
      })

      const link = document.createElement("a")
      link.download = `hcd-classification-results-${new Date().toISOString().split("T")[0]}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (error) {
      console.error("Error exporting to PNG:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Classification Results</CardTitle>
            <CardDescription>Multi-week HCD Subspace classification (Green = 1, Yellow = 0, Red = -1)</CardDescription>
          </div>
          <Button onClick={exportToPNG} variant="outline" size="sm" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export PNG
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table ref={tableRef}>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">HCD Subspace</TableHead>
                {weekResults.map(({ week }) => (
                  <TableHead key={week} className="text-center font-semibold">
                    Week {week}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {HCD_SUBSPACES.map((subspace) => (
                <TableRow key={subspace}>
                  <TableCell className="font-medium">{subspace}</TableCell>
                  {weekResults.map(({ week, subspaceResults }) => {
                    const resultValue = subspaceResults.get(subspace)
                    return (
                      <TableCell key={week} className="text-center">
                        {resultValue !== undefined ? (
                          <div
                            className={`inline-flex rounded-md px-3 py-1 text-sm font-medium ${getColorClass(resultValue)}`}
                          >
                            {resultValue}
                          </div>
                        ) : null}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
