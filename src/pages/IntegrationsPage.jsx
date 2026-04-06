import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Megaphone, MessageCircle, Save, Settings, Key, Link as LinkIcon, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function IntegrationsPage() {
  const [metaStatus, setMetaStatus] = useState('idle')
  const [waStatus, setWaStatus] = useState('idle')

  const saveMetaTokens = (e) => {
     e.preventDefault()
     setMetaStatus('saving')
     setTimeout(() => setMetaStatus('saved'), 1500)
  }

  const saveWaConfig = (e) => {
     e.preventDefault()
     setWaStatus('saving')
     setTimeout(() => setWaStatus('saved'), 1500)
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-heading font-bold text-dark-900">Integrations</h2>
          <p className="text-sm font-medium text-dark-500 mt-1">Connect third-party apps and services to JND CRM.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Meta Ads Integration */}
         <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                     <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>Meta Ads Manager</CardTitle>
                    <p className="text-xs text-dark-500 font-medium mt-0.5">Auto-sync leads from Meta</p>
                  </div>
               </div>
               <Badge variant={metaStatus === 'saved' ? 'success' : 'default'}>
                 {metaStatus === 'saved' ? 'Connected' : 'Not Connected'}
               </Badge>
            </CardHeader>
            <CardContent className="flex-1">
               <form onSubmit={saveMetaTokens} className="space-y-5 h-full flex flex-col">
                 
                 {metaStatus === 'saved' && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5">
                       <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                       <div>
                         <p className="text-sm font-semibold text-emerald-900">Successfully connected!</p>
                         <p className="text-xs text-emerald-700 mt-0.5">Leads from active campaigns will now sync automatically.</p>
                       </div>
                    </div>
                 )}

                 <div className="space-y-4 flex-1">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-dark-700 mb-1.5">
                        <Key className="w-4 h-4 text-dark-400" /> System / Dev Token
                      </label>
                      <input 
                        type="password"
                        placeholder="EAAI..." 
                        className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm font-mono"
                      />
                      <p className="text-xs text-dark-400 mt-1.5">Never share your access token with anyone.</p>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-dark-700 mb-1.5">
                        <Settings className="w-4 h-4 text-dark-400" /> Ad Account ID
                      </label>
                      <input 
                        type="text"
                        placeholder="act_123456789" 
                        className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm font-mono"
                      />
                    </div>
                 </div>

                 <div className="pt-4 border-t border-dark-100 flex justify-end">
                    <Button type="submit" disabled={metaStatus === 'saving'}>
                       {metaStatus === 'saving' ? 'Verifying...' : 'Save Configuration'}
                    </Button>
                 </div>
               </form>
            </CardContent>
         </Card>

         {/* WhatsApp Integration */}
         <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                     <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>WhatsApp Business API</CardTitle>
                    <p className="text-xs text-dark-500 font-medium mt-0.5">Send automated templates & messages</p>
                  </div>
               </div>
               <Badge variant={waStatus === 'saved' ? 'success' : 'default'}>
                 {waStatus === 'saved' ? 'Connected' : 'Not Connected'}
               </Badge>
            </CardHeader>
            <CardContent className="flex-1">
               <form onSubmit={saveWaConfig} className="space-y-5 h-full flex flex-col">
                 
                 <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Official Cloud API Only</p>
                      <p className="text-xs text-blue-700 mt-0.5">Requires a verified Meta Business Account. Once connected, "Click to Chat" flows will use this server instance.</p>
                    </div>
                 </div>

                 <div className="space-y-4 flex-1">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-dark-700 mb-1.5">
                         Phone Number ID
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. 1014163993181..." 
                        className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm font-mono"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-dark-700 mb-1.5">
                         Permanent Access Token
                      </label>
                      <input 
                        type="password"
                        placeholder="EAAI..." 
                        className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm font-mono"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-dark-700 mb-1.5">
                         Webhook Verify Token
                      </label>
                      <div className="flex gap-2">
                         <input 
                           type="text"
                           value="JND_CRM_VERIFY_TOKEN_9Q" 
                           readOnly
                           className="w-full rounded-xl border border-dark-200 bg-dark-100 px-3.5 py-2.5 text-sm text-dark-600 outline-none shadow-sm font-mono cursor-not-allowed"
                         />
                         <Button variant="secondary" type="button" icon={LinkIcon} title="Copy"></Button>
                      </div>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-dark-100 flex justify-end gap-3">
                    <Button variant="secondary" type="button">Manage Templates</Button>
                    <Button type="submit" disabled={waStatus === 'saving'}>
                       {waStatus === 'saving' ? 'Verifying...' : 'Connect WhatsApp'}
                    </Button>
                 </div>
               </form>
            </CardContent>
         </Card>
      </div>
    </>
  )
}
