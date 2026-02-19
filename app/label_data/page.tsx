"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2, ArrowRight, ArrowLeft, Tag, AlertTriangle, Users } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

interface UnlabeledActivity {
    rowid: number | null
    Activity: string | null
}

interface LabelData {
    HCD_Space: string
    HCD_Subspace: string
    Reason: string
    Annotator: string
}

interface Annotation {
    rowid: number
    Activity: string
    HCD_Space: string
    HCD_Subspace: string
    Reason: string
    Annotator: string
}

interface ActivityGroup {
    activity: string
    count: number
    annotators?: string[]
    annotations: Annotation[]
}

interface ActivityAnnotationsResponse {
    total_activities: number
    groups: ActivityGroup[]
}

// HCD Design Process Classification
const HCD_CLASSIFICATION = {
    UNDERSTAND: ["Explore", "Observe", "Empathize", "Reflect"],
    SYNTHESIZE: ["Debrief", "Organize", "Define", "Interpret"],
    IDEATE: ["Brainstorm", "Propose", "Plan", "Narrow Concepts"],
    PROTOTYPE: ["(Re)Create", "Engage", "Evaluate", "Iterate"],
    IMPLEMENT: [
        "Develop",
        "Evolve",
        "Sustain",
        "Execute"
    ]
} as const

type HCDSpace = keyof typeof HCD_CLASSIFICATION

export default function LabelDataPage() {
    const [activity, setActivity] = useState<UnlabeledActivity | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState<LabelData>({
        HCD_Space: "",
        HCD_Subspace: "",
        Reason: "",
        Annotator: ""
    })

    const [rememberAnnotator, setRememberAnnotator] = useState(true)
    const [activityAnnotations, setActivityAnnotations] = useState<ActivityAnnotationsResponse | null>(null)
    const [loadingAnnotations, setLoadingAnnotations] = useState(false)

    const fetchUnlabeledActivity = async () => {
        setLoading(true)
        setError(null)
        setSubmitted(false)

        try {
            // Use Next.js API route instead of direct backend call
            const response = await fetch("/api/fetch-unlabeled")

            if (!response.ok) {
                throw new Error(`Failed to fetch activity: ${response.status}`)
            }

            const data = await response.json()
            setActivity(data)

            // Reset form
            setFormData({
                HCD_Space: "",
                HCD_Subspace: "",
                Reason: "",
                Annotator: ""
            })
        } catch (err) {
            console.error("Error fetching activity:", err)
            setError(err instanceof Error ? err.message : "Failed to fetch activity")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUnlabeledActivity()
        // Load saved annotator name
        const savedAnnotator = localStorage.getItem("savedAnnotatorName")
        if (savedAnnotator) {
            setFormData(prev => ({ ...prev, Annotator: savedAnnotator }))
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!activity?.rowid) {
            setError("No activity to label")
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            // Use Next.js API route instead of direct backend call
            const response = await fetch("/api/label-activity", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    rowid: activity.rowid,
                    ...formData
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || `Failed to submit label: ${response.status}`)
            }

            const result = await response.json()
            console.log("Label submitted:", result)

            // Save annotator name if remember is checked
            if (rememberAnnotator) {
                localStorage.setItem("savedAnnotatorName", formData.Annotator)
            } else {
                localStorage.removeItem("savedAnnotatorName")
            }

            setSubmitted(true)
        } catch (err) {
            console.error("Error submitting label:", err)
            setError(err instanceof Error ? err.message : "Failed to submit label")
        } finally {
            setSubmitting(false)
        }
    }

    const fetchActivityAnnotations = async () => {
        setLoadingAnnotations(true)
        try {
            const response = await fetch("/api/activity-annotations")
            if (!response.ok) {
                throw new Error("Failed to fetch activity annotations")
            }
            const data = await response.json()
            setActivityAnnotations(data)
        } catch (err) {
            console.error("Error fetching activity annotations:", err)
        } finally {
            setLoadingAnnotations(false)
        }
    }

    const handleInputChange = (field: keyof LabelData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleNext = () => {
        fetchUnlabeledActivity()
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 p-6">
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 shadow-lg">
                    <div>
                        <h2 className="font-semibold text-card-foreground">Data Labeling Tool</h2>
                        <p className="text-sm text-muted-foreground">Annotate HCD activities</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/">
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Single PDF Mode
                            </Button>
                        </Link>
                        <Link href="/multi">
                            <Button variant="outline" className="gap-2">
                                Multi-Week Analysis
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Main Card */}
                <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <Tag className="h-6 w-6 text-primary" />
                            <CardTitle className="text-2xl">Label Activity</CardTitle>
                        </div>
                        <CardDescription>
                            Review the activity below and provide appropriate labels
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                                <p className="text-muted-foreground">Fetching unlabeled activity...</p>
                            </div>
                        ) : activity?.rowid === null || activity?.Activity === null ? (
                            <div className="text-center py-16">
                                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                    <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No More Activities</h3>
                                <p className="text-muted-foreground mb-4">
                                    All activities have been labeled. Great job!
                                </p>
                                <Button onClick={fetchUnlabeledActivity} variant="outline">
                                    Check Again
                                </Button>
                            </div>
                        ) : submitted ? (
                            <div className="text-center py-16 space-y-4">
                                <div className="animate-[bounce_0.6s_ease-in-out]">
                                    <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 animate-[scale-in_0.3s_ease-out]" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-semibold text-green-600 dark:text-green-400">
                                    Successfully Submitted!
                                </h3>
                                <p className="text-muted-foreground">
                                    Your annotation has been saved
                                </p>
                                <Button
                                    onClick={handleNext}
                                    size="lg"
                                    className="mt-6 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
                                >
                                    Label Next Activity
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Activity Display */}
                                <div className="rounded-lg border border-border bg-muted/50 p-6">
                                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                        Activity (ID: {activity?.rowid})
                                    </label>
                                    <p className="text-foreground text-lg leading-relaxed">
                                        {activity?.Activity}
                                    </p>
                                </div>

                                {/* Form Fields */}
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="hcd-space" className="text-sm font-medium text-foreground">
                                            HCD Space <span className="text-destructive">*</span>
                                        </label>
                                        <Select
                                            value={formData.HCD_Space}
                                            onValueChange={(value) => {
                                                handleInputChange("HCD_Space", value)
                                                // Reset subspace when space changes
                                                handleInputChange("HCD_Subspace", "")
                                            }}
                                            required
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select HCD Space" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.keys(HCD_CLASSIFICATION).map((space) => (
                                                    <SelectItem key={space} value={space}>
                                                        {space}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="hcd-subspace" className="text-sm font-medium text-foreground">
                                            Process <span className="text-destructive">*</span>
                                        </label>
                                        <Select
                                            value={formData.HCD_Subspace}
                                            onValueChange={(value) => handleInputChange("HCD_Subspace", value)}
                                            disabled={!formData.HCD_Space}
                                            required
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={
                                                    formData.HCD_Space
                                                        ? "Select Process"
                                                        : "Select HCD Space first"
                                                } />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formData.HCD_Space &&
                                                    HCD_CLASSIFICATION[formData.HCD_Space as HCDSpace]?.map((subspace) => (
                                                        <SelectItem key={subspace} value={subspace}>
                                                            {subspace}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="reason" className="text-sm font-medium text-foreground">
                                            Reason <span className="text-destructive">*</span>
                                        </label>
                                        <textarea
                                            id="reason"
                                            required
                                            value={formData.Reason}
                                            onChange={(e) => handleInputChange("Reason", e.target.value)}
                                            rows={3}
                                            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                            placeholder="Explain why you chose these labels..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="annotator" className="text-sm font-medium text-foreground">
                                                Annotator Name <span className="text-destructive">*</span>
                                            </label>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="remember-annotator"
                                                    checked={rememberAnnotator}
                                                    onCheckedChange={(checked) => setRememberAnnotator(checked as boolean)}
                                                />
                                                <label
                                                    htmlFor="remember-annotator"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    Remember Me
                                                </label>
                                            </div>
                                        </div>
                                        <input
                                            id="annotator"
                                            type="text"
                                            required
                                            value={formData.Annotator}
                                            onChange={(e) => handleInputChange("Annotator", e.target.value)}
                                            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Your name or identifier"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                                        {error}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-5 w-5" />
                                            Submit Label
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Activity Annotations Section */}
                <Card className="mt-8 border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <CardTitle className="text-xl">Annotation Conflicts</CardTitle>
                        </div>
                        <CardDescription>Activities with multiple conflicting annotations shown side-by-side for comparison</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={fetchActivityAnnotations}
                            disabled={loadingAnnotations}
                            variant="outline"
                            className="mb-6 gap-2"
                        >
                            {loadingAnnotations ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Fetching...
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-4 w-4" />
                                    Fetch Activity Annotations
                                </>
                            )}
                        </Button>

                        {activityAnnotations && (() => {
                            const conflictCount = activityAnnotations.groups.filter(g => {
                                const spaces = new Set(g.annotations.map(a => a.HCD_Space))
                                const subspaces = new Set(g.annotations.map(a => a.HCD_Subspace))
                                return spaces.size > 1 || subspaces.size > 1
                            }).length

                            return (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">Total Groups:</span>
                                            <span className="font-semibold text-foreground">{activityAnnotations.total_activities}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                                            <span className="text-muted-foreground">Conflicts:</span>
                                            <span className="font-semibold text-amber-600 dark:text-amber-400">{conflictCount}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-green-500" />
                                            <span className="text-muted-foreground">Consistent:</span>
                                            <span className="font-semibold text-green-600 dark:text-green-400">{activityAnnotations.total_activities - conflictCount}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {activityAnnotations.groups.map((group, index) => {
                                            const spaceValues = group.annotations.map(a => a.HCD_Space)
                                            const subspaceValues = group.annotations.map(a => a.HCD_Subspace)
                                            const spaceConflict = new Set(spaceValues).size > 1
                                            const subspaceConflict = new Set(subspaceValues).size > 1
                                            const hasConflict = spaceConflict || subspaceConflict

                                            return (
                                                <div
                                                    key={index}
                                                    className={`rounded-xl overflow-hidden shadow-sm border ${hasConflict
                                                        ? "border-amber-200/70 dark:border-amber-800/50"
                                                        : "border-green-200/70 dark:border-green-800/50"
                                                        }`}
                                                >
                                                    {/* Activity header */}
                                                    <div className={`flex items-center gap-3 px-5 py-3 border-b ${hasConflict
                                                        ? "bg-amber-50/70 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-800/40"
                                                        : "bg-green-50/70 dark:bg-green-900/20 border-green-200/60 dark:border-green-800/40"
                                                        }`}>
                                                        {hasConflict
                                                            ? <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
                                                            : <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 dark:text-green-400" />
                                                        }
                                                        <p className="font-medium text-foreground flex-1 text-sm">{group.activity}</p>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {/* Annotator chips */}
                                                            {(group.annotators ?? group.annotations.map(a => a.Annotator)).map((name, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-background/70 border border-border/50 text-foreground"
                                                                >
                                                                    <span className="h-4 w-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold inline-flex items-center justify-center shrink-0">{i + 1}</span>
                                                                    {name}
                                                                </span>
                                                            ))}
                                                            <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ring-1 ${hasConflict
                                                                ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 ring-amber-300/60 dark:ring-amber-700/40"
                                                                : "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 ring-green-300/60 dark:ring-green-700/40"
                                                                }`}>
                                                                {hasConflict ? "Conflict" : "Consistent"}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">{group.count} annotations</span>
                                                        </div>
                                                    </div>

                                                    {/* Side-by-side comparison grid */}
                                                    <div
                                                        className="grid divide-x divide-border/50"
                                                        style={{ gridTemplateColumns: `repeat(${group.annotations.length}, minmax(0, 1fr))` }}
                                                    >
                                                        {group.annotations.map((annotation, idx) => (
                                                            <div key={annotation.rowid} className="p-4 space-y-3 bg-card">
                                                                {/* Annotator badge */}
                                                                <div className="flex items-center gap-2">
                                                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                                                                        {idx + 1}
                                                                    </span>
                                                                    <span className="font-semibold text-sm text-foreground truncate">{annotation.Annotator}</span>
                                                                </div>

                                                                {/* HCD Space — highlight if conflicting */}
                                                                <div>
                                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">HCD Space</p>
                                                                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${spaceConflict
                                                                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-300/60 dark:ring-amber-700/40"
                                                                        : "bg-primary/10 text-primary ring-primary/20"
                                                                        }`}>
                                                                        {annotation.HCD_Space}
                                                                    </span>
                                                                </div>

                                                                {/* Process — highlight if conflicting */}
                                                                <div>
                                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Process</p>
                                                                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${subspaceConflict
                                                                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-300/60 dark:ring-amber-700/40"
                                                                        : "bg-secondary text-secondary-foreground ring-border/30"
                                                                        }`}>
                                                                        {annotation.HCD_Subspace}
                                                                    </span>
                                                                </div>

                                                                {/* Reason */}
                                                                <div>
                                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reason</p>
                                                                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-md p-2.5">
                                                                        {annotation.Reason || <span className="italic opacity-50">No reason provided</span>}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })()}
                    </CardContent>
                </Card>
            </div>

            {/* Custom animations */}
            <style jsx global>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
        </main>
    )
}
