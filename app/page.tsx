"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Loader2, FileText, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ResultsTable from "@/components/results-table"
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

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile)
        setError(null)
      } else {
        setError("Please select a PDF file")
        setFile(null)
      }
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/classify", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Classification failed: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div>
            <h2 className="font-semibold text-card-foreground">Single PDF Classification</h2>
            <p className="text-sm text-muted-foreground">Classify one PDF at a time</p>
          </div>
          <div className="flex gap-2">
            <Link href="/multi">
              <Button variant="outline" className="gap-2 bg-transparent">
                Multi-Week Analysis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/label_data">
              <Button variant="outline" className="gap-2 bg-transparent">
                Label Data
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">MatSE Senior Design LLM</h1>
          <p className="text-muted-foreground">Upload a PDF file to classify Human-Centered Design activities</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
            <CardDescription>Select a PDF file containing HCD activities for classification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label
                htmlFor="file-upload"
                className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted px-6 py-4 transition-colors hover:border-primary hover:bg-muted/50"
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{file ? file.name : "Choose PDF file"}</span>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,application/pdf"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </label>

              {file && (
                <div className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2">
                  <FileText className="h-4 w-4 text-secondary-foreground" />
                  <span className="text-sm text-secondary-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              )}
            </div>

            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <Button onClick={handleSubmit} disabled={!file || loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Classifying...
                </>
              ) : (
                "Classify PDF"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && <ResultsTable result={result} />}
      </div>
    </main>
  )
}
