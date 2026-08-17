import { useEffect, useMemo, useState } from 'react'
import './App.css'

const ROLES = [
  ['Student', '🎓'],
  ['Faculty', '👩‍🏫'],
  ['HOD', '👨‍💼'],
  ['Academic', '📚'],
  ['Official', '🏛️'],
]

const roleLabels = {
  Student: 'Student Portal',
  Faculty: 'Faculty Portal',
  HOD: 'HOD Portal',
  Academic: 'Academic Office',
  Official: 'Management Portal',
}

const API_BASE = import.meta.env.VITE_API_URL || ''

const api = async (url, options = {}) => {
  const token = localStorage.getItem('classtrack_token')
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('classtrack_user') || 'null'))
  const [role, setRole] = useState('Student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  const refresh = async () => {
    if (!user) return
    try {
      const result = await api('/api/me')
      setData(result)
    } catch (e) {
      localStorage.removeItem('classtrack_token')
      localStorage.removeItem('classtrack_user')
      setUser(null)
      setLoginError(e.message)
    }
  }

  useEffect(() => { refresh() }, [user])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const login = async (e) => {
    e.preventDefault()
    setLoading(true); setLoginError('')
    try {
      const result = await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ role, email: email.trim(), password }),
      })
      localStorage.setItem('classtrack_token', result.token)
      localStorage.setItem('classtrack_user', JSON.stringify(result.user))
      setUser(result.user); setPage('dashboard')
    } catch (err) {
      setLoginError(err.message)
    } finally { setLoading(false) }
  }

  const logout = () => {
    localStorage.removeItem('classtrack_token')
    localStorage.removeItem('classtrack_user')
    setUser(null); setData(null); setEmail(''); setPassword(''); setPage('dashboard')
  }

  if (!user) return <Login role={role} setRole={setRole} email={email} setEmail={setEmail} password={password} setPassword={setPassword} login={login} error={loginError} loading={loading} />
  if (!data) return <div className="loading-screen"><div className="spinner"/><h2>Loading ClassTrack…</h2></div>

  return <div className="shell">
    <Sidebar user={user} page={page} setPage={setPage} logout={logout} />
    <main className="main">
      <header className="topbar">
        <div><span className="eyebrow">{roleLabels[user.role]}</span><h1>{pageTitle(page)}</h1></div>
        <div className="top-user"><div className="avatar">{user.name?.charAt(0)}</div><div><b>{user.name}</b><small>{user.role}</small></div></div>
      </header>
      {toast && <div className="toast">✓ {toast}</div>}
      {page === 'dashboard' && <Dashboard data={data} user={user} go={setPage} />}
      {page === 'timetable' && <Timetable data={data} user={user} startClass={async (id) => {
        try { const r = await api('/api/classes/start',{method:'POST',body:JSON.stringify({timetableId:id})}); setToast(`OTP ${r.otp} generated`); setPage('live'); await refresh() } catch(e){setToast(e.message)}
      }} />}
      {page === 'live' && <Live data={data} user={user} refresh={refresh} setToast={setToast} />}
      {page === 'attendance' && <Attendance data={data} user={user} refresh={refresh} setToast={setToast} />}
      {page === 'syllabus' && <Syllabus data={data} user={user} refresh={refresh} setToast={setToast} />}
      {page === 'analytics' && <Analytics data={data} user={user} />}
      {page === 'feedback' && <Feedback user={user} setToast={setToast} />}
      {page === 'alerts' && <Alerts data={data} />}
      {page === 'substitutions' && <Substitutions data={data} user={user} refresh={refresh} setToast={setToast} />}
    </main>
  </div>
}

function pageTitle(page) { return ({dashboard:'Dashboard',timetable:'Timetable',live:'Live Class',attendance:'Attendance',syllabus:'Syllabus Progress',analytics:'Analytics',feedback:'Feedback',alerts:'Alerts',substitutions:'Substitute Classes'})[page] || 'Dashboard' }

function Login({role,setRole,email,setEmail,password,setPassword,login,error,loading}) {
  return <div className="login-page">
    <section className="login-hero"><div className="brand"><div className="logo">CT</div><div><b>CLASS<span>TRACK</span></b><small>Smart Academic Monitoring</small></div></div><div className="hero-copy"><span>ACADEMIC INTELLIGENCE PLATFORM</span><h1>Every Class.<br/>Every Topic.<br/><em>Every Insight.</em></h1><p>One connected platform for attendance, timetables, syllabus progress and academic intelligence.</p><div className="hero-pills"><i>OTP Attendance</i><i>Live Timetable</i><i>Smart Alerts</i></div></div></section>
    <section className="login-panel"><form className="login-card" onSubmit={login}><span className="eyebrow">WELCOME BACK</span><h2>Sign in to ClassTrack</h2><p>Select your access level to continue.</p><div className="role-grid">{ROLES.map(([r,icon])=><button type="button" key={r} className={role===r?'role active':'role'} onClick={()=>setRole(r)}><span>{icon}</span><b>{r}</b></button>)}</div><label>Email / Faculty ID<input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email or ID (e.g. FAC001)" required /></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required /></label>{error&&<div className="error">{error}</div>}<button className="primary full" disabled={loading}>{loading?'Signing in…':'Sign In →'}</button><div className="login-note">Secure role-based access • Demo credentials are documented in README</div></form></section>
  </div>
}

function Sidebar({user,page,setPage,logout}) {
  const items=[['dashboard','⌂','Dashboard'],['timetable','▦','Timetable'],['live','◉','Live Class'],['attendance','✓','Attendance'],['syllabus','◫','Syllabus'],['analytics','▥','Analytics'],['feedback','☆','Feedback'],['alerts','!','Alerts']]
  const allowed = user.role==='Student' ? items.filter(x=>!['live'].includes(x[0])) : items
  return <aside className="sidebar"><div className="side-brand"><div className="logo small">CT</div><div><b>CLASS<span>TRACK</span></b><small>Academic OS</small></div></div><div className="side-user"><div className="avatar large">{user.name?.charAt(0)}</div><div><b>{user.name}</b><small>{user.role}</small></div></div><nav>{allowed.map(([id,icon,label])=><button key={id} className={page===id?'nav active':'nav'} onClick={()=>setPage(id)}><span>{icon}</span>{label}</button>)}{user.role==='HOD'&&<button className={page==='substitutions'?'nav active':'nav'} onClick={()=>setPage('substitutions')}><span>↔</span>Substitutions</button>}</nav><button className="logout" onClick={logout}>↪ <span>Sign out</span></button></aside>
}

function Dashboard({data,user,go}) {
  const cards = data.dashboard.cards || []
  const substitutions = data.substitutions || []
  return <div className="content"><section className="welcome-card"><div><span className="eyebrow">{greeting()}, {user.name?.split(' ')[0]}</span><h2>{user.role==='HOD'?'Department command center':'Academic command center'}</h2><p>{user.role==='HOD'?'Monitor classes, faculty coverage and academic health from one place.':'Everything important for your role, in one place.'}</p></div><div className="date-chip">{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'})}</div></section><div className="stats">{cards.map((c,i)=><div className="stat" key={i}><small>{c.title}</small><strong>{c.value}</strong><span>{c.note}</span></div>)}</div>{user.role==='HOD'&&<section className="panel substitution-panel"><div className="panel-head"><div><span className="eyebrow">FACULTY COVERAGE</span><h3>Substitute classes</h3><p>See exactly who is covering each absent faculty member.</p></div><button className="primary" onClick={()=>go('substitutions')}>Manage substitutions</button></div>{substitutions.length?<SubstitutionList items={substitutions} compact onRemove={()=>{}}/>:<EmptyState icon="↔" title="No substitutions assigned" text="When a faculty member is absent, assign a substitute here and the class will appear on their timetable." action="Assign substitute" onAction={()=>go('substitutions')}/>}</section>}{user.role==='Faculty'&&<section className="panel substitution-panel"><div className="panel-head"><div><span className="eyebrow">COVERAGE</span><h3>Your substitution classes</h3><p>Classes assigned to you by the HOD.</p></div><button className="text-btn" onClick={()=>go('timetable')}>Open timetable →</button></div>{substitutions.filter(s=>s.substituteFacultyId===user.id).length?<SubstitutionList items={substitutions.filter(s=>s.substituteFacultyId===user.id)} compact/>:<EmptyState icon="✓" title="No substitute classes" text="You are currently not assigned to cover another faculty member's class."/>}</section>}<div className="grid-2"><section className="panel"><div className="panel-head"><div><span className="eyebrow">TODAY</span><h3>{user.role==='Faculty'?'Your teaching schedule':'Your schedule'}</h3></div><button className="text-btn" onClick={()=>go('timetable')}>View timetable →</button></div><Schedule data={data} user={user}/></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">INTELLIGENCE</span><h3>Smart alerts</h3></div><button className="text-btn" onClick={()=>go('alerts')}>View all</button></div><div className="alert-list">{data.alerts.slice(0,4).map((a,i)=><div className={`alert ${a.type}`} key={i}><b>{a.title}</b><span>{a.text||a.message}</span></div>)}</div></section></div><section className="panel"><div className="panel-head"><div><span className="eyebrow">ACADEMIC HEALTH</span><h3>Quick actions</h3></div></div><div className="quick-grid"><button onClick={()=>go('timetable')}>▦<b>Open timetable</b><span>See role-specific classes</span></button><button onClick={()=>go('attendance')}>✓<b>Attendance</b><span>Mark or review attendance</span></button><button onClick={()=>go('syllabus')}>◫<b>Syllabus</b><span>Track course completion</span></button><button onClick={()=>go('analytics')}>▥<b>Analytics</b><span>See academic insights</span></button></div></section></div>
}

function Schedule({data,user}) { const day=data.timetable?.[0]?.day || 'Monday'; const rows=data.timetable?.slice(0,5)||[]; return <div className="schedule">{rows.map(r=><div className="schedule-row" key={r.id}><time>{r.time}</time><div><b>{r.subject}</b><small>{r.code} • {user.role==='Student'?r.faculty:`${r.section} • ${r.room}`}</small>{r.isSubstituted&&<span className="sub-badge">↔ Substitute</span>}</div><span className="tag">{r.room}</span></div>)}</div> }

function Timetable({data,user,startClass}) { return <div className="content"><div className="panel"><div className="panel-head"><div><span className="eyebrow">PERSONALIZED SCHEDULE</span><h3>{user.role==='Student'?'Student Timetable':'Faculty Timetable'}</h3><p>{user.role==='Student'?`Section: ${user.section}`:'Only classes assigned to this faculty account are shown.'}</p></div></div><div className="table-wrap"><table><thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>{user.role==='Student'?'Faculty':'Section'}</th><th>Room</th>{user.role==='Faculty'&&<th>Action</th>}</tr></thead><tbody>{data.timetable.map(r=><tr key={r.id}><td><b>{r.day}</b></td><td>{r.time}</td><td><b>{r.subject}</b><small>{r.code}</small></td><td>{user.role==='Student'?r.faculty:r.section}{r.isSubstituted&&<small className="sub-note">Original: {r.originalFaculty}</small>}</td><td>{r.room}</td>{user.role==='Faculty'&&<td><button className="small-btn" onClick={()=>startClass(r.id)}>{r.isSubstituted?'Start substitute class':'Start class'}</button></td>}</tr>)}</tbody></table></div></div></div> }

function Live({data,user,refresh,setToast}) { const live=data.activeClasses||[]; const mine=user.role==='Faculty'?live.filter(x=>x.facultyId===user.id):live.filter(x=>x.section===user.section); const [otp,setOtp]=useState(''); const [selected,setSelected]=useState(mine[0]);
  useEffect(()=>{setSelected(mine[0])},[data.activeClasses?.length])
  const end=async()=>{if(!selected)return;try{await api(`/api/classes/${selected.id}/end`,{method:'POST'});setToast('Class ended and session saved');await refresh()}catch(e){setToast(e.message)}}
  const mark=async()=>{if(!selected)return;try{await api('/api/attendance/mark',{method:'POST',body:JSON.stringify({classId:selected.id,otp})});setToast('Attendance marked successfully');setOtp('');await refresh()}catch(e){setToast(e.message)}}
  return <div className="content"><section className="live-hero"><div><span className="eyebrow">LIVE SESSION</span><h2>{selected?.subject||'No active class'}</h2><p>{selected?`${selected.code} • ${selected.room} • ${selected.section}`:'Ask faculty to start a class from the timetable.'}</p></div>{selected&&user.role==='Faculty'&&<button className="danger-btn" onClick={end}>End class</button>}</section>{selected?<div className="grid-2"><section className="otp-card"><span className="eyebrow">ONE-TIME PASSWORD</span><div className="otp">{selected.otp}</div><p>Valid for 2 minutes. Students in <b>{selected.section}</b> can use this OTP.</p><div className="timer">{Math.max(0,selected.secondsLeft)} sec remaining</div></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">ATTENDANCE</span><h3>{selected.present}/{selected.totalStudents} present</h3></div></div>{user.role==='Student'?<><input className="otp-input" maxLength="6" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} placeholder="Enter 6-digit OTP"/><button className="primary full" onClick={mark}>Verify & Mark Attendance</button></>:<p className="muted">Students can enter the displayed OTP from their Attendance page. The live count updates automatically.</p>}</section></div>:null}</div> }

function Attendance({data,user,refresh,setToast}) { const [otp,setOtp]=useState(''); const [selected,setSelected]=useState(data.activeClasses?.find(x=>x.section===user.section)); const submit=async()=>{if(!selected)return;try{await api('/api/attendance/mark',{method:'POST',body:JSON.stringify({classId:selected.id,otp})});setToast('Attendance marked successfully');setOtp('');await refresh()}catch(e){setToast(e.message)}}; return <div className="content"><div className="stats">{data.attendance&&<><div className="stat"><small>Attendance</small><strong>{data.attendance.percentage}%</strong><span>Your current rate</span></div><div className="stat"><small>Present</small><strong>{data.attendance.present}</strong><span>Classes attended</span></div><div className="stat"><small>Absent</small><strong>{data.attendance.absent}</strong><span>Classes missed</span></div></>}</div>{user.role==='Student'&&selected?<section className="panel"><span className="eyebrow">OTP ATTENDANCE</span><h3>{selected.subject}</h3><p>Enter the OTP shown by your faculty.</p><input className="otp-input" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} maxLength="6" placeholder="6-digit OTP"/><button className="primary" onClick={submit}>Verify attendance</button></section>:<section className="panel"><span className="eyebrow">LIVE SESSIONS</span><h3>{data.activeClasses?.length||0} class currently active</h3><p className="muted">{user.role==='Student'?'No active class for your section right now.':'Use the Live Class page to monitor active sessions.'}</p></section>}</div> }

function Syllabus({data,user,refresh,setToast}) { const update=async(id,current)=>{const value=prompt('Enter syllabus completion (0-100):',current);if(value===null)return;const n=Number(value);if(!Number.isFinite(n)||n<0||n>100){setToast('Enter a number from 0 to 100');return}try{await api(`/api/subjects/${id}`,{method:'POST',body:JSON.stringify({progress:n})});setToast('Syllabus updated');await refresh()}catch(e){setToast(e.message)}}; return <div className="content"><div className="subject-grid">{data.subjects.map(s=><div className="subject-card" key={s.id}><div className="subject-top"><span>{s.code}</span><b>{s.progress}%</b></div><h3>{s.name}</h3><p>{s.faculty}</p><div className="progress"><i style={{width:`${s.progress}%`}}/></div><small>Expected {s.expected}% • {s.progress<s.expected?'Behind schedule':'On track'}</small>{['Faculty','HOD','Academic','Official'].includes(user.role)&&<button className="small-btn" onClick={()=>update(s.id,s.progress)}>Update progress</button>}</div>)}</div></div> }

function EmptyState({icon,title,text,action,onAction}) { return <div className="empty-state"><div className="empty-icon">{icon}</div><div><b>{title}</b><p>{text}</p>{action&&<button className="small-btn" onClick={onAction}>{action}</button>}</div></div> }

function SubstitutionList({items,compact=false,onRemove}) { return <div className={`sub-list ${compact?'compact':''}`}>{items.map(s=>{ const t=s.slot||{}; return <div className="sub-row" key={s.id}><div className="sub-icon">↔</div><div className="sub-main"><div className="sub-title"><b>{t.subject||'Class'}</b><span>{t.code}</span></div><p>{t.day} • {t.time} • {t.section} • {t.room}</p><div className="sub-people"><span className="original"><small>Original faculty</small><b>{s.originalFaculty}</b></span><span className="arrow">→</span><span className="substitute"><small>Substitute</small><b>{s.substituteFaculty}</b></span></div>{s.reason&&<small className="reason">Reason: {s.reason}</small>}</div>{onRemove&&<button className="icon-btn" title="Remove substitution" onClick={()=>onRemove(s.id)}>×</button>}</div>})}</div> }

function Substitutions({data,user,refresh,setToast}) { const [timetableId,setTimetableId]=useState(''); const [facultyId,setFacultyId]=useState(''); const [reason,setReason]=useState('Faculty absent'); const [saving,setSaving]=useState(false); const substitutions=data.substitutions||[]; const assigned=new Set(substitutions.map(s=>s.timetableId)); const availableClasses=(data.timetable||[]).filter(t=>!assigned.has(t.id)); const faculties=data.facultyDirectory||[];
  useEffect(()=>{ if(!timetableId&&availableClasses[0])setTimetableId(availableClasses[0].id); if(!facultyId&&faculties[0])setFacultyId(faculties[0].id) },[data.substitutions?.length])
  const assign=async()=>{if(!timetableId||!facultyId){setToast('Choose a class and substitute faculty');return} setSaving(true); try{await api('/api/substitutions',{method:'POST',body:JSON.stringify({timetableId,substituteFacultyId:facultyId,reason})});setToast('Substitute assigned successfully');setTimetableId('');setFacultyId('');await refresh()}catch(e){setToast(e.message)}finally{setSaving(false)}}
  const remove=async(id)=>{if(!confirm('Remove this substitution?'))return;try{await api(`/api/substitutions/${id}`,{method:'DELETE'});setToast('Substitution removed');await refresh()}catch(e){setToast(e.message)}}
  if(user.role!=='HOD') return <div className="content"><section className="panel"><h3>Access restricted</h3><p className="muted">Only the HOD can assign substitute faculty.</p></section></div>
  return <div className="content"><section className="page-hero"><div><span className="eyebrow">FACULTY COVERAGE</span><h2>Substitute teacher management</h2><p>Keep every class covered when a faculty member is absent.</p></div><div className="hero-icon">↔</div></section><div className="grid-2 substitution-layout"><section className="panel assign-card"><div className="panel-head"><div><span className="eyebrow">NEW ASSIGNMENT</span><h3>Assign a substitute</h3><p>Select the class that needs coverage and the faculty member who will take it.</p></div></div><label>Class / period<select value={timetableId} onChange={e=>setTimetableId(e.target.value)}><option value="">Select a class</option>{availableClasses.map(t=><option key={t.id} value={t.id}>{t.day} • {t.time} — {t.subject} ({t.section})</option>)}</select></label><label>Substitute faculty<select value={facultyId} onChange={e=>setFacultyId(e.target.value)}><option value="">Select faculty</option>{faculties.map(f=><option key={f.id} value={f.id}>{f.name} ({f.id})</option>)}</select></label><label>Reason<input value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Faculty absent"/></label><button className="primary full" disabled={saving||!timetableId||!facultyId} onClick={assign}>{saving?'Assigning…':'Assign substitute →'}</button><div className="helper"><span>✓</span><p>The substitute will automatically see this class in their Faculty Timetable and can start the normal OTP attendance session.</p></div></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">CURRENT COVERAGE</span><h3>{substitutions.length} substitution{substitutions.length===1?'':'s'}</h3><p>Live view of faculty coverage across the department.</p></div></div>{substitutions.length?<SubstitutionList items={substitutions} onRemove={remove}/>:<EmptyState icon="↔" title="No assignments yet" text="Assigned substitute classes will appear here."/>}</section></div></div> }

function Analytics({data,user}) { return <div className="content"><div className="stats">{(data.dashboard.cards||[]).map((c,i)=><div className="stat" key={i}><small>{c.title}</small><strong>{c.value}</strong><span>{c.note}</span></div>)}</div><div className="grid-2"><section className="panel"><span className="eyebrow">ACADEMIC SIGNALS</span><h3>What needs attention?</h3><div className="signal-list">{data.insights?.map((x,i)=><div className="signal" key={i}><span>{x.type==='warning'?'⚠':'✓'}</span><p>{x.text}</p></div>)}</div></section><section className="panel"><span className="eyebrow">ACTIVE CLASSES</span><h3>{data.activeClasses?.length||0}</h3><p className="muted">Live sessions across the system right now.</p></section></div></div> }

function Feedback({user,setToast}) { const [rating,setRating]=useState(5),[comment,setComment]=useState(''); const submit=async()=>{try{await api('/api/feedback',{method:'POST',body:JSON.stringify({rating,comment})});setComment('');setToast('Feedback submitted');}catch(e){setToast(e.message)}}; return <div className="content"><section className="panel feedback-box"><span className="eyebrow">STUDENT VOICE</span><h3>How was your class?</h3><div className="stars">{[1,2,3,4,5].map(n=><button key={n} className={n<=rating?'star selected':'star'} onClick={()=>setRating(n)}>★</button>)}</div><textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Share a constructive comment…"/><button className="primary" onClick={submit}>Submit feedback</button></section></div> }

function Alerts({data}) { return <div className="content"><div className="alert-list large">{data.alerts.map((a,i)=><div className={`alert ${a.type}`} key={i}><b>{a.title}</b><span>{a.text||a.message}</span></div>)}</div></div> }
function greeting(){const h=new Date().getHours();return h<12?'Good morning':h<17?'Good afternoon':'Good evening'}

export default App
