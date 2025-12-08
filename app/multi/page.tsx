"use client"

import type React from "react"
import { useState } from "react"
import { Upload, Loader2, FileText, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MultiResultsTable from "@/components/multi-results-table"
import Link from "next/link"

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

interface FileWithWeek {
  file: File
  week: number
}

export default function MultiPage() {
  const [files, setFiles] = useState<FileWithWeek[]>([])
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [results, setResults] = useState<{ week: number; result: ClassificationResult }[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === "application/pdf") {
        // Default to next available week
        const nextWeek = files.length > 0 ? Math.max(...files.map((f) => f.week)) + 1 : 1
        setFiles([...files, { file: selectedFile, week: nextWeek }])
        setError(null)
      } else {
        setError("Please select a PDF file")
      }
    }
    // Reset input
    e.target.value = ""
  }

  const handleWeekChange = (index: number, week: number) => {
    const newFiles = [...files]
    newFiles[index].week = week
    setFiles(newFiles)
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError("Please add at least one file")
      return
    }

    setLoading(true)
    setError(null)
    setResults([])
    setCurrentIndex(0)

    try {
      // Sort files by week
      const sortedFiles = [...files].sort((a, b) => a.week - b.week)

      // Process each file in order
      const allResults: { week: number; result: ClassificationResult }[] = []

      for (const [idx, fileWithWeek] of sortedFiles.entries()) {
        // Update progress index before processing
        setCurrentIndex(idx)
        const formData = new FormData()
        formData.append("file", fileWithWeek.file)

        const response = await fetch("/api/classify", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Classification failed for week ${fileWithWeek.week}`)
        }

        const data = await response.json()
        allResults.push({ week: fileWithWeek.week, result: data })
      }

      setResults(allResults)
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
      setCurrentIndex(0)
    }
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div>
            <h2 className="font-semibold text-card-foreground">Multi-Week Analysis</h2>
            <p className="text-sm text-muted-foreground">Upload and track multiple PDFs across weeks</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Single PDF Mode
            </Button>
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">MatSE Senior Design LLM - Multi-Week</h1>
          <p className="text-muted-foreground">Upload multiple PDF reports and track progress across weeks</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload PDF Reports</CardTitle>
            <CardDescription>Add multiple PDF files and assign them to specific weeks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {files.map((fileWithWeek, index) => (
                <div key={index} className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
                  <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 truncate text-sm text-foreground">{fileWithWeek.file.name}</div>
                  <Select
                    value={fileWithWeek.week.toString()}
                    onValueChange={(value) => handleWeekChange(index, Number.parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(20)].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          Week {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(index)}
                    disabled={loading}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <label
              htmlFor="file-upload"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted px-6 py-4 transition-colors hover:border-primary hover:bg-muted/50"
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Add PDF file</span>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={handleFileAdd}
                disabled={loading}
              />
            </label>

            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            {loading && files.length > 0 && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processing file {currentIndex + 1} of {files.length}</span>
                  <span className="text-foreground">
                    {Math.round(((currentIndex) / files.length) * 100)}%
                  </span>
                </div>
                <Progress value={Math.round(((currentIndex) / files.length) * 100)} />
              </div>
            )}

            <Button onClick={handleSubmit} disabled={files.length === 0 || loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Classifying {files.length} files...
                </>
              ) : (
                `Classify ${files.length} PDF${files.length !== 1 ? "s" : ""}`
              )}
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && <MultiResultsTable results={results} />}
      </div>
    </main>
  )
}
