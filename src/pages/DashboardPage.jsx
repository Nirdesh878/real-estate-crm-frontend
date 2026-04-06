import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts'
import { Card, CardContent } from '../components/ui/Card'
import { Users, Target, Activity, TrendingUp, Filter } from 'lucide-react'

// Dummy data for visualizations
const leadTrends = [
  { name: 'Mon', leads: 12 },
  { name: 'Tue', leads: 19 },
  { name: 'Wed', leads: 15 },
  { name: 'Thu', leads: 22 },
  { name: 'Fri', leads: 30 },
  { name: 'Sat', leads: 25 },
  { name: 'Sun', leads: 18 },
]

const conversionData = [
  { name: 'Week 1', rate: 10 },
  { name: 'Week 2', rate: 15 },
  { name: 'Week 3', rate: 12 },
  { name: 'Week 4', rate: 20 },
]

const sourceData = [
  { name: 'Meta Ads', value: 400 },
  { name: 'Google', value: 300 },
  { name: 'Referral', value: 300 },
  { name: 'Direct', value: 200 },
]

export default function DashboardPage() {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
           <h2 className="text-2xl font-heading font-bold text-dark-900">Performance Dashboard</h2>
           <p className="text-sm font-medium text-dark-500 mt-1">Overview of lead acquisition and conversion metrics.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-dark-200 rounded-xl text-sm font-medium text-dark-700 hover:bg-dark-50 transition-colors shadow-sm">
             <Filter className="w-4 h-4" /> This Week
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         <Card className="bg-gradient-to-br from-white to-dark-50 border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                 <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                    <Users className="w-6 h-6" />
                 </div>
                 <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
              </div>
              <h3 className="text-3xl font-heading font-bold text-dark-900">1,245</h3>
              <p className="text-sm font-medium text-dark-500 mt-1">Total Leads</p>
            </CardContent>
         </Card>
         
         <Card className="bg-gradient-to-br from-white to-dark-50 border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                 <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <Activity className="w-6 h-6" />
                 </div>
                 <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+5%</span>
              </div>
              <h3 className="text-3xl font-heading font-bold text-dark-900">84</h3>
              <p className="text-sm font-medium text-dark-500 mt-1">Active Follow-ups</p>
            </CardContent>
         </Card>

         <Card className="bg-gradient-to-br from-white to-dark-50 border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                 <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Target className="w-6 h-6" />
                 </div>
                 <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">-2%</span>
              </div>
              <h3 className="text-3xl font-heading font-bold text-dark-900">18.5%</h3>
              <p className="text-sm font-medium text-dark-500 mt-1">Conversion Rate</p>
            </CardContent>
         </Card>

         <Card className="bg-gradient-to-br from-white to-dark-50 border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                 <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                    <TrendingUp className="w-6 h-6" />
                 </div>
                 <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+24%</span>
              </div>
              <h3 className="text-3xl font-heading font-bold text-dark-900">12</h3>
              <p className="text-sm font-medium text-dark-500 mt-1">Closed Deals</p>
            </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-md border-dark-100">
          <CardContent className="p-6">
            <h3 className="text-lg font-heading font-semibold text-dark-900 mb-6">Leads Acquired Over Time</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadTrends}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="leads" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-dark-100">
          <CardContent className="p-6">
            <h3 className="text-lg font-heading font-semibold text-dark-900 mb-6">Lead Source Value</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#0369a1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
