import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './TeacherDashboardPage.css';

const TABS = {
  EVALUATIONS: 'evaluations',
  CREATE: 'create',
  STUDENTS: 'students',
  COURSES: 'courses',
};

const TeacherDashboardPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(TABS.EVALUATIONS);
  const navigate = useNavigate();

  const [evaluations, setEvaluations] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState('');

  const [formData, setFormData] = useState({
    title: '', description: '', course_id: '',
    maximum_score: 20, time_limit_minute: 60,
    start_date: '', end_date: '',
  });
  const [formError, setFormError] = useState('');

  const [studentForm, setStudentForm] = useState({
    cui: '', name: '', father_surname: '', mother_surname: '',
    email: '', phone: '', password: '',
  });

  const [courseForm, setCourseForm] = useState({
    code: '', name: '', credit: 4, semester: 1, has_laboratory: false,
  });

  const [selectedResults, setSelectedResults] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchEvaluations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/evaluations/my-evaluations');
      setEvaluations(res.data.data || []);
    } catch (err) {
      console.error('Error fetching evaluations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setStudentsLoading(true);
    setStudentsError('');
    try {
      const res = await api.get('/students');
      setStudents(res.data.data || []);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al cargar estudiantes';
      setStudentsError(msg);
      console.error('Error fetching students:', err);
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data.data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === TABS.EVALUATIONS) fetchEvaluations();
    if (activeTab === TABS.STUDENTS) fetchStudents();
    if (activeTab === TABS.COURSES) fetchCourses();
  }, [activeTab, fetchEvaluations, fetchStudents, fetchCourses]);

  const handleCreateEvaluation = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/evaluations', formData);
      setFormData({ title: '', description: '', course_id: '', maximum_score: 20, time_limit_minute: 60, start_date: '', end_date: '' });
      setActiveTab(TABS.EVALUATIONS);
      fetchEvaluations();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al crear evaluación');
    }
  };

  const handlePublish = async (id) => {
    try {
      await api.patch(`/evaluations/${id}/publish`);
      fetchEvaluations();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al publicar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta evaluación?')) return;
    try {
      await api.delete(`/evaluations/${id}`);
      fetchEvaluations();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleViewResults = async (id) => {
    try {
      const res = await api.get(`/evaluations/${id}/results`);
      setSelectedResults(res.data.data || []);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cargar resultados');
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students', studentForm);
      setStudentForm({ cui: '', name: '', father_surname: '', mother_surname: '', email: '', phone: '', password: '' });
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear estudiante');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/courses', courseForm);
      setCourseForm({ code: '', name: '', credit: 4, semester: 1, has_laboratory: false });
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear curso');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="teacher-dashboard">
      <header className="teacher-header glass-panel">
        <div className="header-content">
          <div className="header-left">
            <img src="/logo.png" alt="Logo" className="mini-logo" />
            <h2>{t('nav.teacherPanel')}</h2>
          </div>
          <LanguageSwitcher />
          <button onClick={handleLogout} className="btn-logout">{t('nav.logout')}</button>
        </div>
      </header>

      <nav className="tabs-nav glass-panel">
        {[
          { key: TABS.EVALUATIONS, label: t('nav.myEvaluations') },
          { key: TABS.CREATE, label: t('nav.createEvaluation') },
          { key: TABS.STUDENTS, label: t('nav.students') },
          { key: TABS.COURSES, label: t('nav.courses') },
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="teacher-main">
        {activeTab === TABS.EVALUATIONS && (
          <section>
            <h3 className="section-title">{t('teacher.myEvaluations')}</h3>
            {isLoading ? (
              <div className="loading-state"><div className="spinner-green"></div><p>{t('teacher.loading')}</p></div>
            ) : evaluations.length === 0 ? (
              <div className="empty-state glass-panel"><p>{t('teacher.noEvaluations')}</p></div>
            ) : (
              <div className="evals-grid">
                {evaluations.map(ev => (
                  <div key={ev.id} className="eval-card glass-panel">
                    <div className="eval-header">
                      <h4>{ev.title}</h4>
                      <span className={`status-badge ${ev.evaluation_status?.toLowerCase()}`}>
                        {ev.evaluation_status}
                      </span>
                    </div>
                    <p className="eval-desc">{ev.description || t('teacher.noDescription')}</p>
                    <div className="eval-meta">
                      <span>{t('teacher.course')}: {ev.course_name || '—'}</span>
                      <span>{t('teacher.duration')}: {ev.time_limit_minute} {t('dashboard.minutes')}</span>
                      <span>{t('teacher.startDate')}: {formatDate(ev.start_date)}</span>
                      <span>{t('teacher.endDate')}: {formatDate(ev.end_date)}</span>
                    </div>
                    <div className="eval-actions">
                      {ev.evaluation_status === 'DRAFT' && (
                          <button className="btn-sm btn-publish" onClick={() => handlePublish(ev.id)}>
                            {t('teacher.publish')}
                          </button>
                        )}
                        <button className="btn-sm btn-results" onClick={() => handleViewResults(ev.id)}>
                          {t('teacher.results')}
                        </button>
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(ev.id)}>
                          {t('teacher.delete')}
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedResults && (
              <div className="modal-overlay" onClick={() => setSelectedResults(null)}>
                <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                  <h3>{t('teacher.resultsTitle')}</h3>
                  {selectedResults.length === 0 ? (
                    <p>{t('teacher.noResults')}</p>
                  ) : (
                    <table className="results-table">
                      <thead>
                        <tr>
                          <th>{t('teacher.studentLabel')}</th>
                          <th>{t('teacher.grade')}</th>
                          <th>{t('teacher.status')}</th>
                          <th>{t('teacher.date')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedResults.map(r => (
                          <tr key={r.id}>
                            <td>{r.student_name || '—'}</td>
                            <td>{r.grade != null ? `${r.grade}/20` : '—'}</td>
                            <td>{r.attempt_status || r.status}</td>
                            <td>{formatDate(r.created_at || r.end_time)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <button className="btn-primary" onClick={() => setSelectedResults(null)} style={{marginTop: 20}}>{t('teacher.close')}</button>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === TABS.CREATE && (
          <section>
            <h3 className="section-title">{t('teacher.createTitle')}</h3>
            <form onSubmit={handleCreateEvaluation} className="create-form glass-panel">
              {formError && <div className="error-alert">{formError}</div>}

              <div className="form-row">
                <div className="input-group">
                  <label>{t('teacher.title')}</label>
                  <input className="form-control" required value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>{t('teacher.course')}</label>
                  <select className="form-control" required value={formData.course_id}
                    onChange={e => setFormData({ ...formData, course_id: e.target.value })}>
                    <option value="">{t('teacher.selectCourse')}</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>{t('teacher.description')}</label>
                <textarea className="form-control" rows="3" value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="form-row three-col">
                <div className="input-group">
                  <label>{t('teacher.maxScore')}</label>
                  <input type="number" className="form-control" min="1" value={formData.maximum_score}
                    onChange={e => setFormData({ ...formData, maximum_score: Number(e.target.value) })} />
                </div>
                <div className="input-group">
                  <label>{t('teacher.duration')}</label>
                  <input type="number" className="form-control" min="1" value={formData.time_limit_minute}
                    onChange={e => setFormData({ ...formData, time_limit_minute: Number(e.target.value) })} />
                </div>
                <div className="input-group">
                  <label>{t('teacher.semester')}</label>
                  <input type="number" className="form-control" min="1" max="10" value={formData.semester || ''}
                    onChange={e => setFormData({ ...formData, semester: Number(e.target.value) })} />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>{t('teacher.startDate')}</label>
                  <input type="datetime-local" className="form-control" required value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>{t('teacher.endDate')}</label>
                  <input type="datetime-local" className="form-control" required value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
              </div>

              <button type="submit" className="btn-primary">{t('teacher.createButton')}</button>
            </form>
          </section>
        )}

        {activeTab === TABS.STUDENTS && (
          <section>
            <div className="section-header">
              <h3 className="section-title">{t('nav.students')}</h3>
            </div>

            {studentsError && (
              <div className="error-alert" style={{ marginBottom: 16 }}>
                {studentsError}
                <button onClick={fetchStudents} className="btn-sm btn-publish" style={{ marginLeft: 8 }}>
                  {t('teacher.retry')}
                </button>
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="create-form glass-panel">
              <h4 style={{ marginBottom: 16, color: 'var(--color-primary)' }}>{t('teacher.registerStudent')}</h4>
              <div className="form-row three-col">
                <div className="input-group">
                  <label>{t('teacher.studentCui')}</label>
                  <input className="form-control" required value={studentForm.cui}
                    onChange={e => setStudentForm({ ...studentForm, cui: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>{t('teacher.studentName')}</label>
                  <input className="form-control" required value={studentForm.name}
                    onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>{t('register.fatherSurname')}</label>
                  <input className="form-control" required value={studentForm.father_surname}
                    onChange={e => setStudentForm({ ...studentForm, father_surname: e.target.value })} />
                </div>
              </div>
              <div className="form-row three-col">
                <div className="input-group">
                  <label>{t('register.motherSurname')}</label>
                  <input className="form-control" value={studentForm.mother_surname}
                    onChange={e => setStudentForm({ ...studentForm, mother_surname: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>{t('register.email')}</label>
                  <input type="email" className="form-control" required value={studentForm.email}
                    onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>{t('register.phone')}</label>
                  <input className="form-control" value={studentForm.phone}
                    onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })} />
                </div>
              </div>
              <div className="input-group" style={{ maxWidth: 300 }}>
                <label>{t('register.password')}</label>
                <input type="password" className="form-control" required value={studentForm.password}
                  onChange={e => setStudentForm({ ...studentForm, password: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>{t('register.registerButton')}</button>
            </form>

            <div className="students-list" style={{ marginTop: 24 }}>
              {studentsLoading ? (
                <div className="loading-state"><div className="spinner-green"></div><p>{t('teacher.loadingStudents')}</p></div>
              ) : students.length === 0 ? (
                <div className="empty-state glass-panel"><p>{t('teacher.noStudents')}</p></div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('teacher.studentCui')}</th>
                        <th>{t('teacher.studentName')}</th>
                        <th>{t('teacher.studentEmail')}</th>
                        <th>{t('teacher.studentPhone')}</th>
                        <th>{t('teacher.studentStatus')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s.id}>
                          <td>{s.cui}</td>
                          <td>{s.name} {s.father_surname} {s.mother_surname || ''}</td>
                          <td>{s.email}</td>
                          <td>{s.phone || '—'}</td>
                          <td><span className={`status-badge ${s.status?.toLowerCase()}`}>{s.status || 'ACTIVE'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === TABS.COURSES && (
          <section>
            <h3 className="section-title">{t('nav.courses')}</h3>
            <form onSubmit={handleCreateCourse} className="create-form glass-panel">
              <h4 style={{ marginBottom: 16, color: 'var(--color-primary)' }}>{t('teacher.createCourse')}</h4>
              <div className="form-row three-col">
                <div className="input-group">
                  <label>{t('teacher.code')}</label>
                  <input className="form-control" required value={courseForm.code}
                    onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>{t('teacher.studentName')}</label>
                  <input className="form-control" required value={courseForm.name}
                    onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>{t('teacher.credits')}</label>
                  <input type="number" className="form-control" min="1" max="10" value={courseForm.credit}
                    onChange={e => setCourseForm({ ...courseForm, credit: Number(e.target.value) })} />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>{t('teacher.createCourse')}</button>
            </form>

            {courses.length === 0 ? (
              <div className="empty-state glass-panel" style={{ marginTop: 24 }}><p>{t('teacher.noCourses')}</p></div>
            ) : (
              <div className="table-wrapper" style={{ marginTop: 24 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('teacher.code')}</th>
                      <th>{t('teacher.studentName')}</th>
                      <th>{t('teacher.credits')}</th>
                      <th>{t('teacher.semester')}</th>
                      <th>{t('teacher.laboratory')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(c => (
                      <tr key={c.id}>
                        <td>{c.code}</td>
                        <td>{c.name}</td>
                        <td>{c.credit}</td>
                        <td>{c.semester}</td>
                        <td>{c.has_laboratory ? t('teacher.yes') : t('teacher.no')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboardPage;
