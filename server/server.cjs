const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const PORT = Number(process.env.PORT || 5000)
const DATA_DIR = path.join(__dirname, 'data')
const DATA_FILE = path.join(DATA_DIR, 'database.json')
const DIST_DIR = path.join(__dirname, '..', 'dist')
const APP_ORIGIN = process.env.APP_ORIGIN || '*'
const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS || 60 * 60 * 12)

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const faculty = [
  ['FAC001', 'Mrs. Parameswari', 'parameswari@fxec.edu.in'],
  ['FAC002', 'Ms. Soundariya S', 'soundariya@fxec.edu.in'],
  ['FAC003', 'Mrs. Angeline Valentina Sweety A', 'angeline@fxec.edu.in'],
  ['FAC004', 'Mrs. S.V. Lincy', 'lincy@fxec.edu.in'],
  ['FAC005', 'Mrs. R. Gomathiselvi', 'gomathiselvi@fxec.edu.in'],
  ['FAC006', 'Mrs. Merlin Sneha PC', 'merlin@fxec.edu.in'],
  ['FAC007', 'Mrs. Janet P', 'janet@fxec.edu.in'],
]

const subjects = [
  ['SUB001','24AI5601','Database & Data Warehousing','FAC002',72,78],
  ['SUB002','24AI5602','Machine Learning','FAC001',68,74],
  ['SUB003','24AI5703','Pattern Recognition','FAC003',74,72],
  ['SUB004','24AI5704','AI Enhanced Software Engineering','FAC004',81,76],
  ['SUB005','24AI5706','Artificial Neural Networks','FAC005',65,71],
  ['SUB006','24AI5707','Text Analytics','FAC005',70,72],
  ['SUB007','24IT5804','Network Technologies and Protocols','FAC006',77,75],
  ['SUB008','24AI5603','Java Programming and Embedded SQL','FAC007',80,78],
  ['SUB009','24AI5611','Database & Data Warehousing Laboratory','FAC002',70,76],
  ['SUB010','24AI5612','Machine Learning Laboratory','FAC001',69,74],
  ['SUB011','24HS5911','Communication Skills and Career Readiness Laboratory','FAC007',84,80],
  ['SUB012','24AI5501','Business Analytics with R','FAC004',76,73],
]

const studentSlots = [
  ['Monday','09:00 - 09:50','24IT5804','Room 204'],['Monday','09:50 - 10:40','24AI5603','Room 204'],['Monday','10:55 - 11:45','24AI5602','Room 204'],['Monday','11:45 - 12:35','24IT5804','Room 204'],['Monday','01:20 - 02:10','24HS5911','Lab 3'],['Monday','02:10 - 03:00','24HS5911','Lab 3'],['Monday','03:15 - 04:05','24AI5703','Room 204'],
  ['Tuesday','09:00 - 09:50','24AI5602','Room 204'],['Tuesday','09:50 - 10:40','24AI5706','Room 204'],['Tuesday','10:55 - 11:45','24AI5703','Room 204'],['Tuesday','11:45 - 12:35','24AI5603','Room 204'],['Tuesday','01:20 - 02:10','24HS5911','Lab 3'],['Tuesday','02:10 - 03:00','24HS5911','Lab 3'],['Tuesday','03:15 - 04:05','24IT5804','Room 204'],
  ['Wednesday','09:00 - 09:50','24AI5706','Room 204'],['Wednesday','09:50 - 10:40','24IT5804','Room 204'],['Wednesday','10:55 - 11:45','24AI5601','Room 204'],['Wednesday','11:45 - 12:35','24AI5703','Room 204'],['Wednesday','01:20 - 02:10','24AI5611','Lab 1'],['Wednesday','02:10 - 03:00','24AI5611','Lab 1'],['Wednesday','03:15 - 04:05','24AI5706','Room 204'],
  ['Thursday','09:00 - 09:50','24AI5612','Lab 2'],['Thursday','09:50 - 10:40','24AI5611','Lab 1'],['Thursday','10:55 - 11:45','24AI5706','Room 204'],['Thursday','11:45 - 12:35','24AI5601','Room 204'],['Thursday','01:20 - 02:10','24AI5602','Room 204'],['Thursday','02:10 - 03:00','24AI5602','Room 204'],['Thursday','03:15 - 04:05','24AI5706','Room 204'],
  ['Friday','09:00 - 09:50','24AI5703','Room 204'],['Friday','09:50 - 10:40','24AI5602','Room 204'],['Friday','10:55 - 11:45','24AI5611','Lab 1'],['Friday','11:45 - 12:35','24AI5603','Room 204'],['Friday','01:20 - 02:10','24AI5602','Room 204'],['Friday','02:10 - 03:00','24AI5603','Room 204'],['Friday','03:15 - 04:05','24AI5601','Room 204'],
]

const roles = ['Student', 'Faculty', 'HOD', 'Academic', 'Official']
const demoPassword = process.env.DEMO_PASSWORD || 'demo123'

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}
function verifyPassword(password, stored) {
  if (!stored) return false
  if (!stored.startsWith('scrypt:')) return stored === password
  const [, salt, expected] = stored.split(':')
  const actual = crypto.scryptSync(String(password), salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'))
}
function publicUser(u) {
  const { password, passwordHash, ...safe } = u
  return safe
}
function seed() {
  const users = [{ id:'STU001', role:'Student', email:'student@demo.com', passwordHash:hashPassword(demoPassword), name:'Gopika J', section:'III AI&DS A' }]
  for (const [id, name, email] of faculty) users.push({ id, role:'Faculty', email, passwordHash:hashPassword(demoPassword), name })
  users.push(
    { id:'HOD001', role:'HOD', email:'hod@demo.com', passwordHash:hashPassword(demoPassword), name:'AI&DS HOD' },
    { id:'ACA001', role:'Academic', email:'academic@demo.com', passwordHash:hashPassword(demoPassword), name:'Academic Professor' },
    { id:'OFF001', role:'Official', email:'admin@demo.com', passwordHash:hashPassword(demoPassword), name:'Higher Official' },
  )
  const sm = Object.fromEntries(subjects.map(s => [s[1], { id:s[0], code:s[1], name:s[2], facultyId:s[3], faculty:faculty.find(f=>f[0]===s[3])[1], progress:s[4], expected:s[5] }]))
  const timetable = []
  let n = 1
  for (const [day,time,code,room] of studentSlots) {
    const s = sm[code]
    timetable.push({ id:`TT${String(n++).padStart(3,'0')}`, subjectId:s.id, code, subject:s.name, faculty:s.faculty, facultyId:s.facultyId, section:'III AI&DS A', room, time, day })
  }
  return { users, subjects:Object.values(sm), timetable, activeClasses:[], attendance:[], feedback:[], substitutions:[] }
}

function migrate() {
  let db
  if (fs.existsSync(DATA_FILE)) {
    try { db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) } catch { db = null }
  }
  if (!db) db = seed()
  db.users ||= []
  db.subjects ||= []
  db.timetable ||= []
  db.activeClasses ||= []
  db.attendance ||= []
  db.feedback ||= []
  db.substitutions ||= []

  // Upgrade the old demo database without deleting existing attendance/feedback.
  const fresh = seed()
  for (const user of fresh.users) {
    const existing = db.users.find(u => u.id === user.id)
    if (!existing) db.users.push(user)
    else {
      existing.role = user.role
      existing.email = user.email
      existing.name = user.name
      if (!existing.passwordHash) {
        existing.passwordHash = hashPassword(existing.password || demoPassword)
        delete existing.password
      }
      if (user.section) existing.section = existing.section || user.section
    }
  }
  if (!db.subjects.length) db.subjects = fresh.subjects
  if (!db.timetable.length) db.timetable = fresh.timetable
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2))
  return db
}

const initial = migrate()
const read = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
const save = d => fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2))
const id = prefix => `${prefix}_${crypto.randomBytes(6).toString('hex')}`
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000))

function base64url(value) { return Buffer.from(value).toString('base64url') }
function signToken(userId) {
  const payload = base64url(JSON.stringify({ sub:userId, exp:Math.floor(Date.now()/1000) + SESSION_TTL_SECONDS }))
  const secret = process.env.AUTH_SECRET || 'CHANGE_THIS_IN_PRODUCTION'
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}
function auth(req, db) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const secret = process.env.AUTH_SECRET || 'CHANGE_THIS_IN_PRODUCTION'
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!data.sub || data.exp < Math.floor(Date.now()/1000)) return null
    return db.users.find(u => u.id === data.sub) || null
  } catch { return null }
}

function send(res, status, data, contentType='application/json') {
  const origin = APP_ORIGIN === '*' ? '*' : APP_ORIGIN
  res.writeHead(status, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Vary': 'Origin',
  })
  res.end(contentType === 'application/json' ? JSON.stringify(data) : data)
}
function body(req) {
  return new Promise(resolve => {
    let raw = ''
    req.on('data', chunk => { raw += chunk; if (raw.length > 1_000_000) req.destroy() })
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}) } catch { resolve(null) } })
  })
}
function studentStats(db, user) {
  const mine = db.attendance.filter(a => a.studentId === user.id)
  const total = 30 + mine.length
  const present = Math.min(total, 27 + mine.length)
  return { present, absent: total - present, total, percentage: Math.round(present / total * 100) }
}
function build(db, user) {
  const substitutions = db.substitutions.map(x => {
    const slot = db.timetable.find(t => t.id === x.timetableId)
    const original = db.users.find(u => u.id === x.originalFacultyId)
    const substitute = db.users.find(u => u.id === x.substituteFacultyId)
    return { ...x, slot, originalFaculty: original?.name || x.originalFacultyName, substituteFaculty: substitute?.name || x.substituteFacultyName }
  })
  let timetable = db.timetable.map(x => {
    const sub = substitutions.find(s => s.timetableId === x.id)
    if (!sub) return x
    return { ...x, isSubstituted:true, substitutionId:sub.id, originalFaculty:x.faculty, originalFacultyId:x.facultyId, substituteFaculty:sub.substituteFaculty, faculty:sub.substituteFaculty, facultyId:sub.substituteFacultyId }
  })
  if (user.role === 'Student') timetable = timetable.filter(x => x.section === user.section)
  if (user.role === 'Faculty') timetable = timetable.filter(x => x.facultyId === user.id)
  const activeClasses = db.activeClasses.map(c => ({
    ...c,
    present: db.attendance.filter(a => a.classId === c.id).length,
    totalStudents: db.users.filter(x => x.role === 'Student' && x.section === c.section).length || 50,
    secondsLeft: Math.max(0, Math.floor((c.expiresAt - Date.now()) / 1000)),
    alreadyMarked: db.attendance.some(a => a.classId === c.id && a.studentId === user.id),
  }))
  const avg = Math.round(db.subjects.reduce((a,s) => a + s.progress, 0) / (db.subjects.length || 1))
  const alerts = db.subjects.filter(s => s.progress < s.expected).map(s => ({ type:'warning', title:'Syllabus Behind Schedule', text:`${s.name} is ${s.expected-s.progress}% behind expected progress.` }))
  if (!alerts.length) alerts.push({ type:'positive', title:'Academic Health Looks Good', text:'No critical academic exceptions detected.' })
  let cards
  if (user.role === 'Student') {
    const a = studentStats(db, user)
    cards = [{title:'Attendance',value:a.percentage+'%',note:'Your attendance'},{title:'Syllabus',value:avg+'%',note:'Overall progress'},{title:'Subjects',value:db.subjects.length,note:'Enrolled subjects'},{title:'Live Classes',value:activeClasses.filter(c=>c.section===user.section).length,note:'Currently active'}]
  } else if (user.role === 'Faculty') {
    const mine = db.subjects.filter(s => s.facultyId === user.id)
    const substitutes = substitutions.filter(s => s.substituteFacultyId === user.id)
    cards = [{title:'My Classes',value:timetable.length,note:'Timetable slots'},{title:'Substitutions',value:substitutes.length,note:'Classes assigned to you'},{title:'Live Classes',value:activeClasses.filter(c=>c.facultyId===user.id).length,note:'Currently active'},{title:'Feedback',value:(db.feedback.length ? Math.min(5, db.feedback.reduce((a,f)=>a+f.rating,0)/db.feedback.length).toFixed(1) : '4.6')+'/5',note:'Average rating'}]
  } else if (user.role === 'HOD') {
    cards = [{title:'Department Attendance',value:'91%',note:'Current average'},{title:'Syllabus',value:avg+'%',note:'Academic progress'},{title:'Substitutions',value:substitutions.length,note:'Assigned classes'},{title:'Active Alerts',value:alerts.length,note:'Needs attention'}]
  } else {
    cards = [{title:'Attendance',value:'91%',note:user.role==='Official'?'Institution average':'Department average'},{title:'Syllabus',value:avg+'%',note:'Academic progress'},{title:'Class Conduct',value:'94%',note:'Current semester'},{title:user.role==='Official'?'Students':'Alerts',value:user.role==='Official'?db.users.filter(x=>x.role==='Student').length:alerts.length,note:user.role==='Official'?'Institution':'Needs attention'}]
  }
  return { user:publicUser(user), timetable, substitutions:user.role==='Student'?substitutions.filter(s=>s.slot?.section===user.section):substitutions, facultyDirectory:db.users.filter(x=>x.role==='Faculty').map(publicUser), subjects:db.subjects, activeClasses, attendance:user.role==='Student'?studentStats(db,user):null, dashboard:{cards}, alerts, insights:[{type:'positive',text:'OTP attendance prevents duplicate attendance.'},{type:'positive',text:'Substitute assignments are visible to HOD and assigned faculty.'},{type:'warning',text:'Subjects below expected syllabus progress are flagged automatically.'}] }
}

function serveStatic(req, res, url) {
  if (!fs.existsSync(DIST_DIR)) return false
  let requested = decodeURIComponent(url.pathname)
  if (requested === '/') requested = '/index.html'
  let file = path.normalize(path.join(DIST_DIR, requested))
  if (!file.startsWith(DIST_DIR)) return false
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) file = path.join(DIST_DIR, 'index.html')
  if (!fs.existsSync(file)) return false
  const ext = path.extname(file)
  const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.json':'application/json'}
  send(res, 200, fs.readFileSync(file), types[ext] || 'application/octet-stream')
  return true
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {})
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const db = read()

  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { status:'ok', service:'ClassTrack API' })

  if (req.method === 'POST' && url.pathname === '/api/login') {
    const b = await body(req)
    if (!b) return send(res, 400, {error:'Invalid request body.'})
    const identifier = String(b.email || b.id || '').trim().toLowerCase()
    if (!roles.includes(b.role)) return send(res, 400, {error:'Invalid role.'})
    const user = db.users.find(x => x.role === b.role && (x.email.toLowerCase() === identifier || x.id.toLowerCase() === identifier))
    if (!user || !verifyPassword(b.password, user.passwordHash || user.password)) return send(res, 401, {error:'Invalid login details.'})
    return send(res, 200, {token:signToken(user.id), user:publicUser(user)})
  }

  const user = auth(req, db)
  if (!user) {
    if (!url.pathname.startsWith('/api/')) return serveStatic(req, res) || send(res, 404, {error:'Page not found.'})
    return send(res, 401, {error:'Your session has expired. Please login again.'})
  }
  if (req.method === 'GET' && url.pathname === '/api/me') return send(res, 200, build(db, user))

  if (req.method === 'POST' && url.pathname === '/api/classes/start') {
    if (user.role !== 'Faculty') return send(res, 403, {error:'Faculty access required.'})
    const b = await body(req)
    const timetable = db.timetable.find(x => x.id === b.timetableId)
    if (!timetable) return send(res, 404, {error:'Class not found.'})
    const substitution = db.substitutions.find(x => x.timetableId === timetable.id)
    const allowed = timetable.facultyId === user.id || (substitution && substitution.substituteFacultyId === user.id)
    if (!allowed) return send(res, 403, {error:'This class is not assigned to you.'})
    let active = db.activeClasses.find(x => x.timetableId === timetable.id)
    if (active) return send(res, 200, {otp:active.otp, class:active})
    active = {id:id('CLASS'),timetableId:timetable.id,subjectId:timetable.subjectId,subject:timetable.subject,code:timetable.code,facultyId:user.id,faculty:user.name,originalFacultyId:timetable.facultyId,originalFaculty:timetable.faculty,substitutionId:substitution?.id || null,section:timetable.section,room:timetable.room,time:timetable.time,otp:generateOtp(),createdAt:Date.now(),expiresAt:Date.now()+120000}
    db.activeClasses.push(active); save(db)
    return send(res, 200, {otp:active.otp, class:active})
  }

  if (req.method === 'POST' && url.pathname.startsWith('/api/classes/') && url.pathname.endsWith('/end')) {
    const classId = url.pathname.split('/')[3]
    const index = db.activeClasses.findIndex(x => x.id === classId && x.facultyId === user.id)
    if (index < 0) return send(res, 404, {error:'Class not found.'})
    db.activeClasses.splice(index, 1); save(db)
    return send(res, 200, {success:true})
  }

  if (req.method === 'POST' && url.pathname === '/api/attendance/mark') {
    if (user.role !== 'Student') return send(res, 403, {error:'Student access required.'})
    const b = await body(req)
    const active = db.activeClasses.find(x => x.id === b.classId)
    if (!active) return send(res, 400, {error:'Class is not active.'})
    if (active.section !== user.section) return send(res, 403, {error:'You are not part of this section.'})
    if (Date.now() > active.expiresAt) return send(res, 400, {error:'OTP expired.'})
    if (String(b.otp) !== active.otp) return send(res, 400, {error:'Incorrect OTP.'})
    if (db.attendance.some(a => a.classId === active.id && a.studentId === user.id)) return send(res, 400, {error:'Attendance already marked.'})
    db.attendance.push({id:id('ATT'),classId:active.id,studentId:user.id,studentName:user.name,section:user.section,subject:active.subject,timestamp:Date.now(),status:'Present'})
    save(db); return send(res, 200, {success:true})
  }

  if (req.method === 'POST' && url.pathname === '/api/substitutions') {
    if (user.role !== 'HOD') return send(res, 403, {error:'HOD access required.'})
    const b = await body(req)
    const timetable = db.timetable.find(x => x.id === b.timetableId)
    const substitute = db.users.find(x => x.id === b.substituteFacultyId && x.role === 'Faculty')
    if (!timetable || !substitute) return send(res, 400, {error:'Choose a valid class and substitute faculty.'})
    if (substitute.id === timetable.facultyId) return send(res, 400, {error:'The original faculty cannot substitute their own class.'})
    const existing = db.substitutions.find(x => x.timetableId === timetable.id)
    if (existing) return send(res, 409, {error:'A substitute is already assigned to this class.'})
    const originalConflict = db.timetable.find(t => t.facultyId === substitute.id && t.day === timetable.day && t.time === timetable.time)
    if (originalConflict) return send(res, 409, {error:'That faculty member already has a class at the same time.'})
    const conflict = db.substitutions.find(x => x.substituteFacultyId === substitute.id && x.timetableId !== timetable.id && (() => { const t=db.timetable.find(z=>z.id===x.timetableId); return t && t.day===timetable.day && t.time===timetable.time })())
    if (conflict) return send(res, 409, {error:'That faculty member already has a substitution at the same time.'})
    const record = {id:id('SUB'),timetableId:timetable.id,originalFacultyId:timetable.facultyId,substituteFacultyId:substitute.id,reason:String(b.reason||'Faculty unavailable').slice(0,200),createdAt:Date.now(),createdBy:user.id}
    db.substitutions.push(record); save(db)
    return send(res, 201, {success:true, substitution:record})
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/substitutions/')) {
    if (user.role !== 'HOD') return send(res, 403, {error:'HOD access required.'})
    const substitutionId = url.pathname.split('/')[3]
    const index = db.substitutions.findIndex(x => x.id === substitutionId)
    if (index < 0) return send(res, 404, {error:'Substitution not found.'})
    const linkedClass = db.activeClasses.find(x => x.substitutionId === substitutionId)
    if (linkedClass) return send(res, 400, {error:'End the active class before removing this substitution.'})
    db.substitutions.splice(index,1); save(db)
    return send(res, 200, {success:true})
  }

  if (req.method === 'POST' && url.pathname.startsWith('/api/subjects/')) {
    if (!['Faculty','HOD','Academic','Official'].includes(user.role)) return send(res, 403, {error:'Access denied.'})
    const subjectId = url.pathname.split('/')[3]
    const b = await body(req)
    const subject = db.subjects.find(x => x.id === subjectId)
    if (!subject) return send(res, 404, {error:'Subject not found.'})
    if (user.role === 'Faculty' && subject.facultyId !== user.id) return send(res, 403, {error:'You can only update your subjects.'})
    const progress = Number(b.progress)
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) return send(res, 400, {error:'Progress must be 0-100.'})
    subject.progress = progress; save(db); return send(res, 200, {success:true})
  }

  if (req.method === 'POST' && url.pathname === '/api/feedback') {
    if (user.role !== 'Student') return send(res, 403, {error:'Student access required.'})
    const b = await body(req); const rating = Number(b.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return send(res, 400, {error:'Rating must be 1-5.'})
    db.feedback.push({id:id('FB'),studentId:user.id,rating,comment:String(b.comment||'').slice(0,1000),timestamp:Date.now()})
    save(db); return send(res, 200, {success:true})
  }

  if (!url.pathname.startsWith('/api/')) return serveStatic(req, res) || send(res, 404, {error:'Page not found.'})
  return send(res, 404, {error:'API endpoint not found.'})
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ClassTrack running on port ${PORT}`)
  console.log(`Health: http://localhost:${PORT}/api/health`)
  if (process.env.AUTH_SECRET === 'CHANGE_THIS_IN_PRODUCTION' || !process.env.AUTH_SECRET) console.warn('WARNING: Set AUTH_SECRET in production.')
})
