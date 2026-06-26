import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './ExamPage.css';

const ExamPage = () => {
  const { t } = useTranslation();
  const { id: attemptId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState({ minutes: 0, seconds: 0, total_seconds: 0 });
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const durationRef = useRef(null);

  // Answers state: { [questionId]: { optionId, textResponse, fileUrl } }
  const [answers, setAnswers] = useState({});
  const [uploadingStates, setUploadingStates] = useState({});

  const formatTime = (val) => val.toString().padStart(2, '0');

  useEffect(() => {
    fetchExamData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      startTimeRef.current = null;
      durationRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const fetchExamData = async () => {
    try {
      const response = await api.get(`/attempts/${attemptId}`);
      const data = response.data.data;
      setExam(data);
      
      // Initialize answers object
      const initialAnswers = {};
      data.questions.forEach(q => {
        initialAnswers[q.question_id] = {
          questionId: q.question_id,
          optionId: null,
          textResponse: '',
          fileUrl: ''
        };
      });
      setAnswers(initialAnswers);

      // Start timer
      if (data.time_remaining) {
        const totalSeconds = data.time_remaining.total_seconds;
        durationRef.current = totalSeconds * 1000;
        setTimeRemaining({
          total_seconds: totalSeconds,
          minutes: Math.floor(totalSeconds / 60),
          seconds: totalSeconds % 60
        });
        startTimer();
      }

    } catch (error) {
      console.error('Error cargando examen:', error);
      alert(t('exam.loadError'));
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      if (!startTimeRef.current || !durationRef.current) return;
      
      const elapsed = Date.now() - startTimeRef.current;
      const remainingMs = durationRef.current - elapsed;
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
      
      if (remainingSeconds <= 0) {
        clearInterval(timerRef.current);
        setTimeRemaining({ total_seconds: 0, minutes: 0, seconds: 0 });
        alert(t('exam.timeUp'));
        document.getElementById('submit-exam-btn')?.click();
      } else {
        setTimeRemaining({
          total_seconds: remainingSeconds,
          minutes: Math.floor(remainingSeconds / 60),
          seconds: remainingSeconds % 60
        });
      }
    }, 1000);
  };

  const setOptionAnswer = (questionId, optionId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], optionId }
    }));
  };

  const setTextResponse = (questionId, textResponse) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], textResponse }
    }));
  };

  const handleFileUpload = async (event, questionId) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingStates(prev => ({ ...prev, [questionId]: true }));
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnswers(prev => ({
        ...prev,
        [questionId]: { ...prev[questionId], fileUrl: response.data.file_url }
      }));
    } catch (error) {
      console.error('Error subiendo imagen', error);
      alert(t('exam.uploadError'));
    } finally {
      setUploadingStates(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const isQuestionAnswered = (questionId) => {
    const ans = answers[questionId];
    if (!ans) return false;
    if (ans.optionId !== null) return true;
    if (ans.textResponse.trim() !== '' || ans.fileUrl !== '') return true;
    return false;
  };

  const scrollToQuestion = (index) => {
    const element = document.getElementById('question-' + index);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const confirmSubmit = () => {
    const total = exam.questions.length;
    const answered = Object.keys(answers).filter(k => isQuestionAnswered(k)).length;
    
    let msg = t('exam.confirmMessage', { answered, total });
    if (answered < total) {
      msg = t('exam.warningMessage', { pending: total - answered });
    }

    if (window.confirm(msg)) {
      submitExam();
    }
  };

  const submitExam = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = null;
    durationRef.current = null;

    try {
      const payloadAnswers = Object.values(answers).filter(a => a.optionId || a.textResponse || a.fileUrl);

      const response = await api.post(`/attempts/${attemptId}/submit`, {
        answers: payloadAnswers
      });
      
      const submitData = response.data.data;
      const status = submitData.attempt.attempt_status;

      const resultEntry = {
        id: attemptId,
        title: exam.title,
        course_name: exam.course_name,
        status,
        grade: submitData.result?.grade ?? null,
        obtained_score: submitData.attempt.obtained_score ?? null,
        submitted_at: new Date().toISOString(),
      };

      const stored = JSON.parse(localStorage.getItem('examResults') || '[]');
      stored.unshift(resultEntry);
      localStorage.setItem('examResults', JSON.stringify(stored.slice(0, 50)));

      if (status === 'NEEDS_GRADING') {
        alert(t('exam.submitSuccessNeedsGrading'));
      } else {
        alert(t('exam.submitSuccess', { grade: submitData.result.grade }));
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al enviar examen:', error);
      alert(t('exam.submitError') + ': ' + (error.response?.data?.error || t('exam.errorConnection')));
      setIsSubmitting(false);
      // Restart timer if needed, but for simplicity we keep it paused.
    }
  };

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner-green"></div>
        <p>{t('exam.loading')}</p>
      </div>
    );
  }

  if (!exam) return null;

  return (
    <div className="exam-layout">
      {/* Navbar Superior */}
      <header className="exam-header glass-panel">
        <div className="header-left">
          <img src="/logo.png" alt="Logo" className="mini-logo" />
          <div className="exam-titles">
            <h2>{exam.title}</h2>
            <span className="course-name">{exam.course_name}</span>
          </div>
        </div>
        <div className={`timer-display ${timeRemaining.total_seconds < 300 ? 'warning' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>{formatTime(timeRemaining.minutes)}:{formatTime(timeRemaining.seconds)}</span>
        </div>
      </header>

      <div className="exam-body">
        {/* MAIN: Lista de Preguntas */}
        <main className="questions-container">
          {exam.questions.map((question, index) => (
            <div 
              key={question.question_id} 
              id={'question-' + index}
              className="question-card glass-panel"
            >
              <div className="question-header">
                <span className="question-number">{t('exam.question')} {index + 1}</span>
                <span className="question-points">{question.points} {t('exam.points')}</span>
              </div>
              <p className="question-text">{question.text}</p>

              {/* MULTIPLE CHOICE */}
              {question.type === 'MULTIPLE_CHOICE' && (
                <div className="options-list">
                  {question.options.map(option => (
                    <label 
                      key={option.option_id} 
                      className={`option-label ${answers[question.question_id]?.optionId === option.option_id ? 'selected' : ''}`}
                    >
                      <input 
                        type="radio" 
                        name={'q_' + question.question_id} 
                        value={option.option_id}
                        checked={answers[question.question_id]?.optionId === option.option_id}
                        onChange={() => setOptionAnswer(question.question_id, option.option_id)}
                      />
                      <span className="option-text">{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* OPEN ENDED (Text + Photo) */}
              {question.type === 'OPEN_ENDED' && (
                <div className="open-ended-container">
                  <textarea 
                    value={answers[question.question_id]?.textResponse || ''}
                    onChange={(e) => setTextResponse(question.question_id, e.target.value)}
                    className="form-control text-response" 
                    rows="4" 
                    placeholder={t('exam.textPlaceholder')}
                  ></textarea>
                  
                  <div className="file-upload-section">
                    <label className="btn-secondary file-btn">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      <span>{t('exam.uploadPhoto')}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        hidden 
                        onChange={(e) => handleFileUpload(e, question.question_id)}
                      />
                    </label>

                    {/* Preview de foto subida */}
                    {answers[question.question_id]?.fileUrl && (
                      <div className="uploaded-file-preview">
                        <img src={answers[question.question_id].fileUrl} alt="Evidencia subida" />
                        <span className="success-text">{t('exam.photoAttached')}</span>
                      </div>
                    )}
                    {uploadingStates[question.question_id] && (
                      <div className="uploading-text">
                        <span className="spinner small blue"></span> {t('exam.uploading')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </main>

        {/* ASIDE: Mapa de Preguntas */}
        <aside className="exam-sidebar">
          <div className="map-card glass-panel">
            <h3>{t('exam.questionMap')}</h3>
            <p className="map-subtitle">{t('exam.quickNav')}</p>
            
            <div className="map-grid">
              {exam.questions.map((question, index) => (
                <button 
                  key={'map-' + question.question_id}
                  className={`map-btn ${isQuestionAnswered(question.question_id) ? 'answered' : ''}`}
                  onClick={() => scrollToQuestion(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="map-legend">
              <div className="legend-item"><span className="box answered"></span> {t('exam.answered')}</div>
              <div className="legend-item"><span className="box pending"></span> {t('exam.pending')}</div>
            </div>

            <button 
              id="submit-exam-btn"
              onClick={confirmSubmit} 
              className="btn-primary submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? <span className="spinner small"></span> : <span>{t('exam.submit')}</span>}
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default ExamPage;
