import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Midweave</h1>
      <p className="text-xl mb-8">Curated Midjourney Style Library</p>
      <div className="flex gap-4">
        <Link 
          href="/admin" 
          className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors"
        >
          Go to Admin
        </Link>
      </div>
    </main>
  )
}