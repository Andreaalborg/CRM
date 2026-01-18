import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from "@/components/ui";
import { User, Lock, Bell, Palette } from "lucide-react";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  return (
    <>
      <Header 
        title="Innstillinger"
        description="Administrer din konto og preferanser"
      />
      
      <div className="p-6 max-w-3xl space-y-6">
        {/* Profil */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--color-primary-light)]">
                <User className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <CardTitle>Profil</CardTitle>
                <CardDescription>Din personlige informasjon</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Fullt navn</Label>
                <Input 
                  id="name" 
                  defaultValue={session.user.name || ""} 
                />
              </div>
              <div>
                <Label htmlFor="email">E-postadresse</Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={session.user.email || ""} 
                  disabled
                />
              </div>
            </div>
            <Button>Lagre endringer</Button>
          </CardContent>
        </Card>

        {/* Passord */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--color-warning-light)]">
                <Lock className="h-5 w-5 text-[var(--color-warning)]" />
              </div>
              <div>
                <CardTitle>Passord</CardTitle>
                <CardDescription>Endre ditt passord</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-password">Nåværende passord</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="new-password">Nytt passord</Label>
                <Input id="new-password" type="password" />
              </div>
              <div>
                <Label htmlFor="confirm-password">Bekreft passord</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </div>
            <Button>Oppdater passord</Button>
          </CardContent>
        </Card>

        {/* Varsler */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--color-info-light)]">
                <Bell className="h-5 w-5 text-[var(--color-info)]" />
              </div>
              <div>
                <CardTitle>Varsler</CardTitle>
                <CardDescription>Administrer e-postvarsler</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Nye leads</p>
                <p className="text-sm text-[var(--color-muted)]">
                  Få e-post når noen fyller ut et skjema
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Ukentlig oppsummering</p>
                <p className="text-sm text-[var(--color-muted)]">
                  Motta en ukentlig rapport over aktivitet
                </p>
              </div>
              <input type="checkbox" className="w-5 h-5" />
            </div>
            <Button>Lagre preferanser</Button>
          </CardContent>
        </Card>

        {/* Fargetema */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--color-success-light)]">
                <Palette className="h-5 w-5 text-[var(--color-success)]" />
              </div>
              <div>
                <CardTitle>Utseende</CardTitle>
                <CardDescription>Tilpass appens utseende</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <button className="flex-1 p-4 rounded-xl border-2 border-[var(--color-primary)] bg-white">
                <div className="h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded mb-2" />
                <p className="text-sm font-medium">Lys</p>
              </button>
              <button className="flex-1 p-4 rounded-xl border-2 border-[var(--color-border)] bg-gray-900">
                <div className="h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded mb-2" />
                <p className="text-sm font-medium text-white">Mørk</p>
              </button>
              <button className="flex-1 p-4 rounded-xl border-2 border-[var(--color-border)]">
                <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-600 rounded mb-2" />
                <p className="text-sm font-medium">System</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

