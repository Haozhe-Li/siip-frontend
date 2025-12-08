import Link from "next/link"

export function Footer() {
    return (
        <footer className="border-t">
            <div className="container mx-auto px-4 py-6 text-sm text-muted-foreground flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p>
                    © {new Date().getFullYear()} LLM HCD Classifier by Haozhe Li and Zhicheng Hu.
                </p>
                <div className="flex items-center gap-4">
                    <Link href="/" className="hover:underline">
                        Home
                    </Link>
                    <Link
                        href="/multi"
                        className="hover:underline"
                    >
                        Batch Classify
                    </Link>
                    <Link
                        href="https://github.com/Haozhe-Li/SIIP-HCD-classifier"
                        className="hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        GitHub
                    </Link>
                </div>
            </div>
        </footer>
    )
}
