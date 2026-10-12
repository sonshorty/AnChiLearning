import {
  Badge,
  Avatar,
  Button,
  Card,
  FluentProvider,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  ProgressBar,
  Skeleton,
  SkeletonItem,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Tab,
  TabList,
  Text,
  Title1,
  Title2,
  createDarkTheme,
  createLightTheme,
} from '@fluentui/react-components';
import {
  ArrowRightRegular,
  ArrowUploadRegular,
  BookOpenRegular,
  DarkThemeRegular,
  CheckmarkRegular,
  HomeRegular,
  LightbulbRegular,
  PersonRegular,
  WeatherSunnyRegular,
} from '@fluentui/react-icons';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from './api';
import { recordAnswer } from './progress/progressStore';
import type { Child, LearningPath, Subject } from './api/types';

const brandRamp = {
  10: '#0b2927', 20: '#0d3e3a', 30: '#10534e', 40: '#146b65',
  50: '#0c8078', 60: '#318f87', 70: '#4fa097', 80: '#70b2a9',
  90: '#91c4bd', 100: '#aed4cf', 110: '#c7e2de', 120: '#d8ece9',
  130: '#e5f3f1', 140: '#eff8f7', 150: '#f7fbfa', 160: '#ffffff',
};
const lightTheme = createLightTheme(brandRamp);
const darkTheme = createDarkTheme(brandRamp);

function App() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    const stored = localStorage.getItem('app-theme');
    return stored === 'dark' || stored === 'light' ? stored : 'system';
  });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const location = useLocation();
  const navigate = useNavigate();
  const darkMode = themeMode === 'dark' || (themeMode === 'system' && systemDark);
  const selectedTab = location.pathname.startsWith('/parent/import') ? 'import' :
    location.pathname.startsWith('/parent') ? 'parent' :
      location.pathname.startsWith('/learn') ? 'activity' : 'learn';

  useEffect(() => {
    localStorage.setItem('app-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return (
    <FluentProvider theme={darkMode ? darkTheme : lightTheme} style={{ minHeight: '100vh' }}>
      <div className="app-shell" data-theme={darkMode ? 'dark' : 'light'}>
        <header className="topbar">
          <Link className="brand" to="/" aria-label="AnChi Learning, trang chủ">
            <span className="brand-mark">A</span>
            <span>AnChi <b>Learning</b></span>
          </Link>
          <TabList className="top-nav" selectedValue={selectedTab} aria-label="Điều hướng chính">
            <Tab value="learn" icon={<HomeRegular />} onClick={() => navigate('/')}>Góc học của con</Tab>
            <Tab value="activity" icon={<WeatherSunnyRegular />} onClick={() => navigate('/learn/math/math-1')}>Hoạt động</Tab>
            <Tab value="parent" icon={<PersonRegular />} onClick={() => navigate('/parent')}>Phụ huynh</Tab>
            <Tab value="import" icon={<ArrowUploadRegular />} onClick={() => navigate('/parent/import')}>Nhập câu hỏi</Tab>
          </TabList>
          <div className="top-actions">
            <Button
              appearance="subtle"
              icon={darkMode ? <LightbulbRegular /> : <DarkThemeRegular />}
              aria-label={`Giao diện ${themeMode === 'system' ? 'theo hệ thống' : themeMode === 'dark' ? 'tối' : 'sáng'}, nhấn để đổi`}
              title={`Giao diện: ${themeMode === 'system' ? 'Tự động' : themeMode === 'dark' ? 'Tối' : 'Sáng'}`}
              onClick={() => setThemeMode(current => current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system')}
            />
            <Avatar name="Phụ huynh" color="brand" size={32} />
          </div>
        </header>
        <main className="page-content">
          <Routes>
            <Route path="/" element={<LearningMap />} />
            <Route path="/learn/:subject/:activityId" element={<ActivityPage />} />
            <Route path="/parent" element={<ParentOverview />} />
            <Route path="/parent/import" element={<ImportQuestions />} />
          </Routes>
        </main>
        <footer className="site-footer"><span>AnChi Learning</span><span>Học vui mỗi ngày, lớn khôn từng chút</span></footer>
      </div>
    </FluentProvider>
  );
}

function useLoad<T>(load: () => Promise<T>, dependencies: unknown[]) {
  const [state, setState] = useState<{ value: T | null; error: string | null; loading: boolean }>({ value: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState(current => ({ ...current, loading: true, error: null }));
    load().then(value => { if (active) setState({ value, error: null, loading: false }); })
      .catch(error => { if (active) setState({ value: null, error: error instanceof Error ? error.message : 'Không thể tải dữ liệu', loading: false }); });
    return () => { active = false; };
  }, [...dependencies, attempt]);
  return { ...state, retry: () => setAttempt(current => current + 1) };
}

function LearningMap() {
  const children = useLoad(() => api.listChildren(), []);
  const paths = useLoad(() => api.listLearningPaths(), []);
  const navigate = useNavigate();
  const loading = children.loading || paths.loading;
  const error = children.error ?? paths.error;
  const empty = !children.value?.length || !paths.value?.length;
  return (
    <motion.div className="page-stack" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <section className="hero-panel">
        <svg className="hero-mesh" aria-hidden="true" viewBox="0 0 800 400" preserveAspectRatio="none">
          <defs>
            <radialGradient id="map-mesh-a" cx="0%" cy="0%" r="80%"><stop offset="0%" stopColor="var(--brand-accent)" stopOpacity=".55" /><stop offset="100%" stopColor="var(--brand-accent)" stopOpacity="0" /></radialGradient>
            <radialGradient id="map-mesh-b" cx="100%" cy="100%" r="80%"><stop offset="0%" stopColor="var(--brand-primary)" stopOpacity=".55" /><stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" /></radialGradient>
          </defs>
          <rect width="800" height="400" fill="url(#map-mesh-a)" /><rect width="800" height="400" fill="url(#map-mesh-b)" />
        </svg>
        <Text className="hero-kicker">MỖI NGÀY MỘT CHẶNG VUI</Text>
        <Title1>Con muốn khám phá môn nào hôm nay?</Title1>
        <Text className="hero-copy">Chọn Toán hoặc Tiếng Việt, rồi tiếp tục hành trình câu hỏi vừa sức với độ tuổi của con.</Text>
        <div className="hero-actions">
          <Button appearance="primary" icon={<LightbulbRegular />} onClick={() => navigate('/learn/math/math-1')}>Học Toán</Button>
          <Button appearance="subtle" icon={<BookOpenRegular />} onClick={() => navigate('/learn/vietnamese/vietnamese-1')}>Học Tiếng Việt</Button>
        </div>
      </section>
      <section id="learning-paths" className="section-block">
        <div className="section-heading"><div><Text className="eyebrow">ĐƯỜNG HỌC CỦA CÁC CON</Text><Title2>Chọn một chặng để tiếp tục</Title2></div><Text className="muted">Lộ trình theo từng độ tuổi</Text></div>
        {loading ? <LoadingCards /> : error ? <ErrorState message={error} retry={() => { children.retry(); paths.retry(); }} /> : empty ? <EmptyState title="Chưa có đường học" action="Xem hồ sơ trẻ" onAction={() => navigate('/parent')} /> : (
          <div className="path-grid">
            {children.value?.map(child => {
              const path = paths.value?.find(item => item.childId === child.id);
              return path ? <LearningPathCard key={path.id} child={child} path={path} /> : null;
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
}

function LearningPathCard({ child, path }: { child: Child; path: LearningPath }) {
  const navigate = useNavigate();
  return <Card className="path-card">
    <div className="path-card-heading"><Avatar name={child.name} color="brand" /><div><Title2>{child.name}</Title2><Badge appearance="tint" color="subtle">{child.age} tuổi</Badge></div></div>
    <Text className="path-subject">{path.subject === 'math' ? 'Toán' : 'Tiếng Việt'} · {path.title}</Text>
    <div className="path-progress-label"><Text>{path.completed} / {path.total} chặng</Text><Badge appearance="tint" color="success">Đang tiến gần đích</Badge></div>
    <ProgressBar value={path.completed / path.total} />
    <ol className="path-nodes" aria-label={`Các chặng ${path.title} của ${child.name}`}>
      {path.nodes.map(node => <li className={`path-node ${node.state}`} key={node.title}>
        <span className="path-node-status">{node.state === 'done' ? <CheckmarkRegular /> : node.state === 'current' ? <WeatherSunnyRegular /> : <span aria-hidden="true" />}</span>
        <span>{node.title}</span>
        <Badge appearance="tint" color={node.state === 'done' ? 'success' : node.state === 'current' ? 'brand' : 'subtle'}>{node.state === 'done' ? 'Đã xong' : node.state === 'current' ? 'Đang học' : 'Sắp tới'}</Badge>
      </li>)}
    </ol>
    <Button appearance="primary" icon={<ArrowRightRegular />} iconPosition="after" onClick={() => navigate(`/learn/${path.subject}/${path.subject}-1`)}>Tiếp tục học</Button>
  </Card>;
}

function ActivityPage() {
  const { subject = 'math', activityId = 'math-1' } = useParams();
  const navigate = useNavigate();
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const safeSubject: Subject = subject === 'vietnamese' ? 'vietnamese' : 'math';
  const questionState = useLoad(() => api.listQuestions({ subject: safeSubject }), [safeSubject, activityId]);
  const requestedIndex = questionState.value?.findIndex(item => item.id === activityId) ?? -1;
  const questionIndex = requestedIndex >= 0 ? requestedIndex : 0;
  const question = questionState.value?.[questionIndex];
  async function check(value: string) {
    if (!question) return;
    try {
      const children = await api.listChildren();
      const child = children.find(item => item.age === question.age) ?? children[0];
      if (!child) throw new Error('Hãy tạo hồ sơ trẻ trước khi kiểm tra đáp án.');
      const result = await api.checkAnswer({ childId: child.id, questionId: question.id, answer: value });
      if (!result) {
        setFeedback({ correct: false, message: 'Chưa có kết quả để kiểm tra.' });
        return;
      }
      await recordAnswer({ childId: child.id, questionId: question.id, correct: result.correct });
      setFeedback({ correct: result.correct, message: result.correct ? 'Chính xác! Con làm tốt lắm.' : `Chưa đúng rồi, thử lại nhé!` });
    } catch (error) { setFeedback({ correct: false, message: error instanceof Error ? error.message : 'Có lỗi xảy ra' }); }
  }
  if (questionState.loading) return <LoadingCards />;
  if (questionState.error) return <ErrorState message={questionState.error} retry={questionState.retry} />;
  return <motion.section className="activity-view" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
    <Button appearance="subtle" icon={<HomeRegular />} onClick={() => navigate('/')}>Bản đồ học tập</Button>
    {question ? <>
      <div className="activity-progress"><span>CÂU HỎI {questionIndex + 1} / {questionState.value?.length}</span><ProgressBar value={(questionIndex + 1) / (questionState.value?.length ?? 1)} /><span>{questionIndex + 1}/{questionState.value?.length}</span></div>
      <Card className="question-card"><Text className="eyebrow">{question.subject === 'math' ? 'TOÁN HỌC' : 'TIẾNG VIỆT'} · {question.age} TUỔI</Text><Title1>{question.prompt}</Title1>
      <Text className="muted">Con hãy chọn kết quả đúng nhé!</Text>
      {question.choices?.length ? <div className="answer-options">{question.choices.map(choice => <Button key={choice} appearance={answer === choice ? 'primary' : 'outline'} onClick={() => setAnswer(choice)}>{choice}</Button>)}</div> : <Input value={answer} onChange={event => setAnswer(event.target.value)} placeholder="Nhập câu trả lời của con" />}
      {feedback && <MessageBar intent={feedback.correct ? 'success' : 'warning'}><MessageBarBody><MessageBarTitle>{feedback.message}</MessageBarTitle></MessageBarBody></MessageBar>}
      <Button appearance="primary" disabled={!answer} onClick={() => check(answer)}>Kiểm tra đáp án</Button>
      <Text className="question-hint">Cứ bình tĩnh suy nghĩ, con sẽ tìm ra đáp án!</Text></Card>
    </> : <EmptyState title="Chặng học này đang nghỉ ngơi" action="Về bản đồ" onAction={() => navigate('/')} />}
  </motion.section>;
}

function ParentOverview() {
  const children = useLoad(() => api.listChildren(), []);
  const paths = useLoad(() => api.listLearningPaths(), []);
  const progress = useLoad(() => api.listRecentProgress(), []);
  const [questionSet, setQuestionSet] = useState<'all' | 'custom'>('custom');
  const questions = useLoad(() => api.listQuestions(questionSet === 'all' ? {} : { age: 10 }), [questionSet]);
  const [addingChild, setAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState(7);
  const [childError, setChildError] = useState('');
  const navigate = useNavigate();
  const progressRows = progress.value ?? [];
  const answerCount = progressRows.reduce((total, item) => total + item.total, 0);
  const correctCount = progressRows.reduce((total, item) => total + item.correct, 0);
  const accuracy = answerCount ? `${Math.round(correctCount / answerCount * 100)}%` : '—';
  const longestStreak = Math.max(0, ...progressRows.map(item => item.streakDays));
  return <motion.div className="page-stack parent-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <section className="parent-hero hero-panel">
      <svg className="hero-mesh" aria-hidden="true" viewBox="0 0 800 400" preserveAspectRatio="none"><defs>
        <radialGradient id="parent-mesh-a" cx="0%" cy="0%" r="80%"><stop offset="0%" stopColor="var(--brand-accent)" stopOpacity=".55" /><stop offset="100%" stopColor="var(--brand-accent)" stopOpacity="0" /></radialGradient>
        <radialGradient id="parent-mesh-b" cx="100%" cy="100%" r="80%"><stop offset="0%" stopColor="var(--brand-primary)" stopOpacity=".55" /><stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" /></radialGradient>
      </defs><rect width="800" height="400" fill="url(#parent-mesh-a)" /><rect width="800" height="400" fill="url(#parent-mesh-b)" /></svg>
      <Text className="hero-kicker">KHÔNG GIAN PHỤ HUYNH</Text>
      <Title1>Tổng quan học tập</Title1>
      <Text className="hero-copy">Theo dõi hồ sơ, tiến độ học gần đây và độ phủ câu hỏi. Tiến độ được lưu cục bộ trên thiết bị này.</Text>
      <div className="hero-actions"><Button appearance="primary" onClick={() => navigate('/parent/import')}>Nhập câu hỏi</Button><Button appearance="subtle" onClick={() => navigate('/')}>Mở bản đồ học tập</Button></div>
    </section>
    <div className="metric-grid"><Metric icon={<WeatherSunnyRegular />} label="Câu trả lời đã ghi nhận" value={String(answerCount)} /><Metric icon={<CheckmarkRegular />} label="Tỷ lệ chính xác" value={accuracy} /><Metric icon={<BookOpenRegular />} label="Chuỗi học liên tiếp" value={longestStreak ? `${longestStreak} ngày` : '—'} /></div>
    <section className="section-block"><div className="section-heading"><div><Text className="eyebrow">HỒ SƠ TRẺ</Text><Title2>Những người học nhỏ</Title2></div><Button appearance="outline" onClick={() => { setAddingChild(true); setChildError(''); }}>Thêm hồ sơ</Button></div>
      {addingChild && <form className="child-create-form" onSubmit={async event => {
        event.preventDefault();
        try {
          await api.createChild({ name: newChildName.trim(), age: newChildAge });
          setNewChildName('');
          setNewChildAge(7);
          setAddingChild(false);
          children.retry();
        } catch (error) { setChildError(error instanceof Error ? error.message : 'Không thể tạo hồ sơ.'); }
      }}><Field label="Tên trẻ"><Input required maxLength={80} value={newChildName} onChange={event => setNewChildName(event.target.value)} /></Field><Field label="Độ tuổi"><Input required type="number" min={4} max={18} value={String(newChildAge)} onChange={event => setNewChildAge(Number(event.target.value))} /></Field><Button type="submit" appearance="primary">Lưu hồ sơ</Button><Button type="button" appearance="subtle" onClick={() => setAddingChild(false)}>Hủy</Button>{childError && <Text role="alert">{childError}</Text>}</form>}
      {children.loading || paths.loading ? <LoadingCards /> : children.error || paths.error ? <ErrorState message={children.error ?? paths.error ?? 'Không thể tải hồ sơ.'} retry={() => { children.retry(); paths.retry(); }} /> : children.value?.length ? <div className="child-list">{children.value.map(item => {
        const path = paths.value?.find(value => value.childId === item.id);
        return <ChildRow key={item.id} child={item} path={path} />;
      })}</div> : <EmptyState title="Chưa có hồ sơ trẻ" action="Mở bản đồ học tập" onAction={() => navigate('/')} />}
    </section>
    <section className="section-block"><div className="section-heading"><div><Text className="eyebrow">TIẾN ĐỘ GẦN ĐÂY</Text><Title2>Mỗi ngày một bước tiến</Title2></div></div>{progress.loading ? <LoadingRows /> : progress.error ? <ErrorState message={progress.error} retry={progress.retry} /> : progress.value?.length ? <div className="overview-table"><Table size="small"><TableHeader><TableRow><TableHeaderCell>Trẻ</TableHeaderCell><TableHeaderCell>Môn học</TableHeaderCell><TableHeaderCell>Chính xác</TableHeaderCell><TableHeaderCell>Chuỗi ngày</TableHeaderCell></TableRow></TableHeader><TableBody>{progress.value.map(item => <TableRow key={`${item.childId}-${item.subject}`}><TableCell>{item.childName}</TableCell><TableCell>{item.subject === 'math' ? 'Toán' : 'Tiếng Việt'}</TableCell><TableCell>{item.correct} / {item.total}</TableCell><TableCell>{item.streakDays} ngày</TableCell></TableRow>)}</TableBody></Table></div> : <EmptyState title="Chưa có tiến độ học tập" action="Về bản đồ" onAction={() => navigate('/')} />}</section>
    <section className="section-block"><div className="section-heading"><div><Text className="eyebrow">NGÂN HÀNG CÂU HỎI</Text><Title2>Nội dung hiện có</Title2></div><Text className="muted">{questions.value?.length ?? 0} câu hỏi</Text></div>
      <TabList selectedValue={questionSet} aria-label="Bộ lọc câu hỏi"><Tab value="all" onClick={() => setQuestionSet('all')}>Tất cả câu hỏi</Tab><Tab value="custom" onClick={() => setQuestionSet('custom')}>Bài tập tự tạo · tuổi 10</Tab></TabList>
      {questions.loading ? <LoadingRows /> : questions.error ? <ErrorState message={questions.error} retry={questions.retry} /> : questions.value?.length ? <div className="overview-table"><Table size="small"><TableHeader><TableRow><TableHeaderCell>Môn học</TableHeaderCell><TableHeaderCell>Độ tuổi</TableHeaderCell><TableHeaderCell>Câu hỏi</TableHeaderCell><TableHeaderCell>Trạng thái</TableHeaderCell></TableRow></TableHeader><TableBody>{questions.value.slice(0, 6).map(item => <TableRow key={item.id}><TableCell>{item.subject === 'math' ? 'Toán' : 'Tiếng Việt'}</TableCell><TableCell>{item.age} tuổi</TableCell><TableCell>{item.prompt}</TableCell><TableCell><Badge appearance="tint" color="success">Đang dùng</Badge></TableCell></TableRow>)}</TableBody></Table></div> : <EmptyState title="Chưa có câu hỏi trong bộ lọc này" action="Tạo câu hỏi đầu tiên" onAction={() => navigate('/parent/import')} />}
    </section>
  </motion.div>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <Card className="metric-card"><span className="metric-icon">{icon}</span><Text className="muted">{label}</Text><Title2>{value}</Title2></Card>; }
function ChildRow({ child, path }: { child: Child; path?: LearningPath }) { return <Card className="child-row"><Avatar name={child.name} color="brand" /><div className="child-main"><b>{child.name}</b><span>{child.age} tuổi{path ? ` · ${path.subject === 'math' ? 'Toán' : 'Tiếng Việt'}: ${path.title}` : ' · Chưa có lộ trình'}</span></div>{path && <div className="child-progress"><ProgressBar value={path.total ? path.completed / path.total : 0} /><span>{path.completed}/{path.total}</span></div>}</Card>; }

function ImportQuestions() {
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');
  const [subject, setSubject] = useState<Subject>('math');
  const [age, setAge] = useState(7);
  const questions = useLoad(() => api.listQuestions({}), []);
  async function importFile(file?: File) {
    if (!file) return;
    setFileName(file.name);
    try {
      const result = await api.importQuestions({ file, subject, ageRange: `${age}-${age + 1}` });
      if (!result) {
        setStatus('Chưa có dữ liệu câu hỏi để nhập.');
        return;
      }
      setStatus(`Đã nhập ${result.imported} câu hỏi, ${result.rejected} dòng cần kiểm tra.`);
      questions.retry();
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Không thể nhập tệp.'); }
  }
  return <motion.div className="page-stack import-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <div><Text className="eyebrow">NGÂN HÀNG CÂU HỎI</Text><Title1>Nhập câu hỏi</Title1><Text className="muted">Thêm câu hỏi mới từ tệp CSV để con có thêm thử thách.</Text></div>
    <Card className="import-form"><div className="form-grid"><Field label="Môn học"><select value={subject} onChange={event => setSubject(event.target.value as Subject)}><option value="math">Toán</option><option value="vietnamese">Tiếng Việt</option></select></Field><Field label="Độ tuổi" validationState="warning" validationMessage="Kiểm tra nhóm tuổi trước khi nhập tệp."><select value={age} onChange={event => setAge(Number(event.target.value))}>{Array.from({ length: 10 }, (_, index) => index + 4).map(item => <option key={item} value={item}>{item}-{item + 1} tuổi</option>)}</select></Field></div>
      <div className="upload-zone"><LightbulbRegular /><b>{fileName || 'Chọn tệp CSV để tải lên'}</b><span>Định dạng: subject, age, question, answer, choices</span><label className="upload-button">Chọn tệp<input type="file" accept=".csv,text/csv" onChange={event => importFile(event.target.files?.[0])} /></label></div>
      <div className="validation-note"><MessageBar intent="warning"><MessageBarBody><MessageBarTitle>Kiểm tra định dạng trước khi nhập</MessageBarTitle> Mỗi dòng cần có câu hỏi và đáp án. Đáp án lựa chọn cách nhau bằng dấu |.</MessageBarBody></MessageBar></div>
      {status && <MessageBar intent={status.startsWith('Đã nhập') ? 'success' : 'error'}><MessageBarBody>{status}</MessageBarBody></MessageBar>}
      <div className="csv-preview"><div className="section-heading"><Title2>Câu hỏi hiện có</Title2><Button appearance="subtle" onClick={questions.retry}>Tải lại</Button></div>{questions.loading ? <LoadingRows /> : questions.error ? <ErrorState message={questions.error} retry={questions.retry} /> : questions.value?.length ? <div className="overview-table"><Table size="small"><TableHeader><TableRow><TableHeaderCell>Môn học</TableHeaderCell><TableHeaderCell>Tuổi</TableHeaderCell><TableHeaderCell>Câu hỏi</TableHeaderCell><TableHeaderCell>Đáp án</TableHeaderCell></TableRow></TableHeader><TableBody>{questions.value.map(question => <TableRow key={question.id}><TableCell>{question.subject === 'math' ? 'Toán' : 'Tiếng Việt'}</TableCell><TableCell>{question.age}</TableCell><TableCell>{question.prompt}</TableCell><TableCell>{question.answer}</TableCell></TableRow>)}</TableBody></Table></div> : <EmptyState title="Chưa có câu hỏi" action="Tải lại" onAction={questions.retry} />}</div>
    </Card>
  </motion.div>;
}

function LoadingCards() { return <div className="subject-grid"><Card className="subject-card"><Skeleton><SkeletonItem size={48} /><SkeletonItem /><SkeletonItem /></Skeleton></Card><Card className="subject-card"><Skeleton><SkeletonItem size={48} /><SkeletonItem /><SkeletonItem /></Skeleton></Card></div>; }
function LoadingRows() { return <div className="loading-rows"><Skeleton><SkeletonItem /><SkeletonItem /><SkeletonItem /></Skeleton></div>; }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <MessageBar intent="error"><MessageBarBody><MessageBarTitle>Không tải được dữ liệu</MessageBarTitle>{message} <Button appearance="subtle" onClick={retry}>Thử lại</Button></MessageBarBody></MessageBar>; }
function EmptyState({ title, action, onAction }: { title: string; action: string; onAction: () => void }) { return <Card className="empty-state"><span className="empty-icon"><BookOpenRegular /></span><Title2>{title}</Title2><Text className="muted">Mọi hành trình đều bắt đầu từ một bước nhỏ.</Text><Button appearance="primary" onClick={onAction}>{action}</Button></Card>; }

export default App;