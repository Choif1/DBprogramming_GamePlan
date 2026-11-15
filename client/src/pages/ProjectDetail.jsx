import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { FiArrowLeft } from 'react-icons/fi';

const sections = [
  { key: 'overview', title: '기획 개요' },
  { key: 'gameplay', title: '게임플레이' },
  { key: 'gamesystem', title: '게임 시스템' },
  { key: 'story', title: '스토리' },
  { key: 'features', title: '주요 특징' },
];
const sectionTitles = Object.fromEntries(sections.map(({ key, title }) => [key, title]));

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
};

const ProjectDetail = () => {
  const { id } = useParams();
  const { isLoggedIn, currentUser } = useOutletContext();
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState('');
  const [feedbackReload, setFeedbackReload] = useState(0);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackSection, setFeedbackSection] = useState('overview');
  const [feedbackStatus, setFeedbackStatus] = useState('loading');
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [deletingFeedbackId, setDeletingFeedbackId] = useState(null);
  const isOwner = isLoggedIn && String(currentUser?.id) === String(project?.user_id);

  useEffect(() => {
    let isCurrent = true;
    setStatus('loading');
    setProject(null);

    axios.get(`/api/projects/${id}`)
      .then(({ data }) => {
        if (!isCurrent) return;
        setProject(data);
        setStatus('ready');
      })
      .catch((error) => {
        if (!isCurrent) return;
        setErrorMessage(error.response?.data?.message || '기획서를 불러오지 못했습니다.');
        setStatus('error');
      });

    return () => { isCurrent = false; };
  }, [id]);

  useEffect(() => {
    let isCurrent = true;
    setFeedbackStatus('loading');
    setFeedbackError('');
    const params = feedbackFilter ? { section: feedbackFilter } : {};
    axios.get(`/api/projects/${id}/feedbacks`, { params })
      .then(({ data }) => {
        if (!isCurrent) return;
        setFeedbacks(Array.isArray(data) ? data : []);
        setFeedbackStatus('ready');
      })
      .catch((error) => {
        if (!isCurrent) return;
        setFeedbackError(error.response?.data?.message || '피드백을 불러오지 못했습니다.');
        setFeedbackStatus('error');
      });
    return () => { isCurrent = false; };
  }, [id, feedbackFilter, feedbackReload]);

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    const content = feedbackContent.trim();
    if (!content) {
      setFeedbackError('피드백 내용을 입력해 주세요.');
      return;
    }
    setFeedbackSubmitting(true);
    setFeedbackError('');
    try {
      await axios.post(`/api/projects/${id}/feedbacks`, {
        section: feedbackSection,
        content,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('gameplan_token')}` },
      });
      setFeedbackContent('');
      setFeedbackFilter(isOwner ? feedbackSection : '');
      setFeedbackReload((value) => value + 1);
    } catch (error) {
      setFeedbackError(error.response?.data?.message || '피드백을 등록하지 못했습니다.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleFeedbackDelete = async (feedback) => {
    if (!window.confirm('이 피드백을 삭제할까요?')) return;
    setDeletingFeedbackId(feedback.id);
    setFeedbackError('');
    try {
      await axios.delete(`/api/projects/${id}/feedbacks/${feedback.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('gameplan_token')}` },
      });
      setFeedbacks((current) => current.filter(({ id: currentId }) => currentId !== feedback.id));
    } catch (error) {
      setFeedbackError(error.response?.data?.message || '피드백을 삭제하지 못했습니다.');
    } finally {
      setDeletingFeedbackId(null);
    }
  };

  return (
    <Page>
      <Content>
        <BackLink to="/projects"><FiArrowLeft aria-hidden="true" /> 목록으로</BackLink>

        {status === 'loading' ? (
          <MessagePanel role="status">기획서를 불러오는 중이에요.</MessagePanel>
        ) : status === 'error' ? (
          <MessagePanel role="alert">
            <MessageTitle>{errorMessage}</MessageTitle>
            <MessageCopy>목록으로 돌아가 다른 기획서를 확인해 보세요.</MessageCopy>
            <ReturnLink to="/projects">기획서 목록으로</ReturnLink>
          </MessagePanel>
        ) : (
          <>
            {project.image && <ProjectImage src={project.image} alt={`${project.title} 대표 이미지`} />}
            <ProjectHeader>
              <ProjectHeading>
                <div>
                  <Genre>{project.genre}</Genre>
                  <Title>{project.title}</Title>
                </div>
                {isLoggedIn && String(currentUser?.id) === String(project.user_id) && (
                  <EditLink to={`/projects/${project.id}/edit`}>수정</EditLink>
                )}
              </ProjectHeading>
              <Meta><span>작성자 <strong>{project.author}</strong></span>{project.created_at && <span>{formatDate(project.created_at)}</span>}</Meta>
            </ProjectHeader>

            <SectionList>
              {sections.map(({ key, title }) => (
                <DocumentSection key={key}>
                  <SectionTitle>{title}</SectionTitle>
                  <SectionBody>{project[key] || '등록된 내용이 없습니다.'}</SectionBody>
                </DocumentSection>
              ))}
            </SectionList>

            <FeedbackPanel>
              <FeedbackHeading>
                <div>
                  <FeedbackTitle>피드백</FeedbackTitle>
                  <FeedbackDescription>기획서의 특정 섹션에 의견을 남겨 보세요.</FeedbackDescription>
                </div>
                {isOwner && (
                  <FilterField>
                    <FilterLabel htmlFor="feedback-filter">섹션 필터</FilterLabel>
                    <FilterSelect id="feedback-filter" value={feedbackFilter} onChange={(event) => setFeedbackFilter(event.target.value)}>
                      <option value="">전체 섹션</option>
                      {sections.map(({ key, title }) => <option key={key} value={key}>{title}</option>)}
                    </FilterSelect>
                  </FilterField>
                )}
              </FeedbackHeading>

              {isLoggedIn ? (
                <FeedbackForm onSubmit={handleFeedbackSubmit}>
                  <FeedbackFormTop>
                    <FilterLabel htmlFor="feedback-section">피드백 대상</FilterLabel>
                    <FilterSelect id="feedback-section" value={feedbackSection} onChange={(event) => setFeedbackSection(event.target.value)}>
                      {sections.map(({ key, title }) => <option key={key} value={key}>{title}</option>)}
                    </FilterSelect>
                  </FeedbackFormTop>
                  <FeedbackTextarea value={feedbackContent} onChange={(event) => setFeedbackContent(event.target.value)} placeholder="기획서에 대한 의견을 작성해 주세요." rows={4} maxLength={5000} />
                  <FeedbackFormBottom>
                    {feedbackError && <FeedbackError role="alert">{feedbackError}</FeedbackError>}
                    <FeedbackSubmit type="submit" disabled={feedbackSubmitting}>{feedbackSubmitting ? '등록 중...' : '피드백 등록'}</FeedbackSubmit>
                  </FeedbackFormBottom>
                </FeedbackForm>
              ) : (
                <LoginPrompt>피드백을 작성하려면 <Link to="/login" state={{ from: { pathname: `/projects/${id}` } }}>로그인</Link>해 주세요.</LoginPrompt>
              )}

              {feedbackStatus === 'loading' ? (
                <FeedbackNotice>피드백을 불러오는 중이에요.</FeedbackNotice>
              ) : feedbackStatus === 'error' ? (
                <FeedbackNotice role="alert">{feedbackError}</FeedbackNotice>
              ) : feedbacks.length ? (
                <FeedbackList>
                  {feedbacks.map((feedback) => (
                    <FeedbackCard key={feedback.id}>
                      <FeedbackCardMeta>
                        <FeedbackSection>{sectionTitles[feedback.section] || feedback.section}</FeedbackSection>
                        <FeedbackCardActions>
                          <FeedbackAuthor>{feedback.author} · {formatDate(feedback.created_at)}</FeedbackAuthor>
                          {isLoggedIn && (isOwner || String(currentUser?.id) === String(feedback.user_id)) && (
                            <FeedbackDelete type="button" disabled={deletingFeedbackId === feedback.id} onClick={() => handleFeedbackDelete(feedback)}>
                              {deletingFeedbackId === feedback.id ? '삭제 중...' : '삭제'}
                            </FeedbackDelete>
                          )}
                        </FeedbackCardActions>
                      </FeedbackCardMeta>
                      <FeedbackBody>{feedback.content}</FeedbackBody>
                    </FeedbackCard>
                  ))}
                </FeedbackList>
              ) : (
                <FeedbackNotice>아직 등록된 피드백이 없어요.</FeedbackNotice>
              )}
            </FeedbackPanel>
          </>
        )}
      </Content>
    </Page>
  );
};

export default ProjectDetail;

const Page = styled.div`
  flex: 1;
  width: 100%;
  color: rgb(50, 50, 50);
  background: #fff;
`;

const Content = styled.div`
  width: min(100%, 1120px);
  margin: 0 auto;
  padding: 38px clamp(26px, 8vw, 120px) 90px;
  @media (max-width: 600px) { padding: 28px 22px 64px; }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 12px;
  &:hover { color: #000; }
`;

const ProjectHeader = styled.header`
  margin-top: 38px;
  padding-bottom: 28px;
  border-bottom: 1px solid #e6e6e6;
`;

const ProjectHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
`;

const EditLink = styled(Link)`
  flex: 0 0 auto;
  padding: 9px 14px;
  border: 1px solid #dedede;
  border-radius: 4px;
  color: #555;
  font-size: 12px;
  font-weight: 600;
  &:hover { border-color: rgb(50, 50, 50); color: rgb(50, 50, 50); }
`;

const ProjectImage = styled.img`
  display: block;
  width: 100%;
  max-height: 420px;
  margin-top: 28px;
  border: 1px solid #e5e5e5;
  border-radius: 7px;
  background: #f2f2f2;
  object-fit: cover;
`;

const Genre = styled.div`
  display: inline-block;
  padding: 6px 9px;
  border: 1px solid #dedede;
  border-radius: 3px;
  color: #666;
  font-size: 11px;
`;

const Title = styled.h1`
  margin-top: 15px;
  color: rgb(50, 50, 50);
  font-size: clamp(28px, 4.5vw, 42px);
  font-weight: 800;
  letter-spacing: -1.5px;
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  margin-top: 15px;
  color: #888;
  font-size: 11px;
  strong { margin-left: 4px; color: #555; font-weight: 600; }
`;

const SectionList = styled.div`
  display: flex;
  flex-direction: column;
`;

const DocumentSection = styled.section`
  padding: 27px 0 30px;
  border-bottom: 1px solid #e8e8e8;
`;

const SectionTitle = styled.h2`
  color: rgb(50, 50, 50);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -.4px;
`;

const SectionBody = styled.p`
  margin-top: 12px;
  color: #555;
  font-size: 14px;
  line-height: 1.9;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const MessagePanel = styled.div`
  margin-top: 54px;
  padding: 64px 20px;
  border: 1px solid #e7e7e7;
  border-radius: 7px;
  text-align: center;
  color: #666;
  font-size: 13px;
`;

const MessageTitle = styled.h1`
  color: #444;
  font-size: 17px;
`;

const MessageCopy = styled.p`
  margin-top: 8px;
  color: #888;
  font-size: 12px;
`;

const ReturnLink = styled(Link)`
  display: inline-block;
  margin-top: 19px;
  padding: 10px 14px;
  background: rgb(50, 50, 50);
  color: #fff;
  font-size: 11px;
`;

const FeedbackPanel = styled.section`
  margin-top: 48px;
  padding-top: 30px;
  border-top: 2px solid #dedede;
`;
const FeedbackHeading = styled.div`display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; @media (max-width: 560px) { align-items: flex-start; flex-direction: column; }`;
const FeedbackTitle = styled.h2`color: rgb(50, 50, 50); font-size: 22px; font-weight: 800; letter-spacing: -.6px;`;
const FeedbackDescription = styled.p`margin-top: 7px; color: #888; font-size: 11px;`;
const FilterField = styled.div`display: flex; align-items: center; gap: 9px;`;
const FilterLabel = styled.label`color: #666; font-size: 11px; font-weight: 600;`;
const FilterSelect = styled.select`min-width: 130px; height: 36px; padding: 0 10px; border: 1px solid #ddd; border-radius: 4px; background: #fff; color: #555; font: inherit; font-size: 11px;`;
const FeedbackForm = styled.form`margin-top: 22px; padding: 17px; border: 1px solid #e5e5e5; border-radius: 6px; background: #fafafa;`;
const FeedbackFormTop = styled.div`display: flex; align-items: center; gap: 10px; margin-bottom: 12px;`;
const FeedbackTextarea = styled.textarea`width: 100%; min-height: 92px; padding: 11px; resize: vertical; border: 1px solid #ddd; border-radius: 4px; outline: none; background: #fff; color: #444; font: inherit; font-size: 12px; line-height: 1.7; &:focus { border-color: #888; } &::placeholder { color: #aaa; }`;
const FeedbackFormBottom = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px;`;
const FeedbackError = styled.p`color: #666; font-size: 11px;`;
const FeedbackSubmit = styled.button`padding: 9px 13px; border-radius: 4px; background: rgb(50, 50, 50); color: #fff; font: inherit; font-size: 11px; font-weight: 700; &:disabled { cursor: wait; opacity: .6; }`;
const LoginPrompt = styled.p`margin-top: 20px; padding: 17px; border: 1px solid #e7e7e7; border-radius: 5px; color: #777; font-size: 12px; a { color: rgb(50, 50, 50); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }`;
const FeedbackList = styled.div`display: flex; flex-direction: column; gap: 10px; margin-top: 20px;`;
const FeedbackCard = styled.article`padding: 15px 16px; border: 1px solid #e8e8e8; border-radius: 5px; background: #fff;`;
const FeedbackCardMeta = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 12px;`;
const FeedbackSection = styled.span`padding: 4px 7px; border: 1px solid #e5e5e5; border-radius: 3px; color: #666; font-size: 10px;`;
const FeedbackAuthor = styled.span`color: #999; font-size: 10px; text-align: right;`;
const FeedbackCardActions = styled.div`display: flex; align-items: center; gap: 11px;`;
const FeedbackDelete = styled.button`padding: 4px 6px; border: 1px solid #e3e3e3; border-radius: 3px; background: #fff; color: #777; font: inherit; font-size: 10px; &:hover { border-color: #999; color: #444; } &:disabled { cursor: wait; opacity: .6; }`;
const FeedbackBody = styled.p`margin-top: 11px; color: #555; font-size: 12px; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere;`;
const FeedbackNotice = styled.p`margin-top: 18px; padding: 22px 12px; color: #888; font-size: 12px; text-align: center;`;
