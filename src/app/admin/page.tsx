"use client"

import { useState } from "react"
import { UploadForm } from "@/components/admin/upload-form"
import { LibraryView } from "@/components/admin/library-view"
import { LoginForm } from "@/components/admin/login-form"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("upload")

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <LoginForm />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>

      <div className="flex min-h-screen pt-16">
        <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] hidden md:block">
          <Sidebar onTabChange={setActiveTab} />
        </div>

        <main className="flex-1 md:ml-64 transition-all duration-200">
          <div className="p-6">
            <Card className="mb-8">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Midweave Admin</CardTitle>
                    <CardDescription>
                      Manage your Midjourney style library
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      logout()
                      window.location.reload()
                    }}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {activeTab === "upload" && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload New Styles</CardTitle>
                  <CardDescription>
                    Add new images and their Midjourney parameters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UploadForm />
                </CardContent>
              </Card>
            )}

            {activeTab === "manage" && (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Library</CardTitle>
                  <CardDescription>
                    View and manage your style library
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LibraryView />
                </CardContent>
              </Card>
            )}

            {activeTab === "settings" && (
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>
                    Configure your admin preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg">
                    Settings Coming Soon
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}