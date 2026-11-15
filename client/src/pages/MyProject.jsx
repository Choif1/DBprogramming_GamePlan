import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import styled from 'styled-components';
import { FiPlus } from 'react-icons/fi';

const MyProject = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn, setCurrentUser } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    axios.get('/api/projects/my', {
      headers: { Authorization: `Bearer ${localStorage.getItem('gameplan_token')}` },
    })
      .then(({ data }) => {
        if (!isCurrent) return;
        setProjects(Array.isArray(data) ? data : []);
        setStatus('ready');
      })
      .catch((requestError) => {
        if (!isCurrent) return;
        if (requestError.response?.status === 401) {
          localStorage.removeItem('gameplan_token');
          localStorage.removeItem('gameplan_user');
          setIsLoggedIn(false);
          setCurrentUser(null);
          navigate('/login', { replace: true });
          return;
        }
        setError(requestError.response?.data?.message || '내 기획서를 불러오지 못했습니다.');
        setStatus('error');
      });
    return () => { isCurrent = false; };
  }, [navigate, setCurrentUser, setIsLoggedIn]);

  const handleDelete = async (project) => {
    const confirmed = window.confirm(`“${project.title}” 기획서를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`);
    if (!confirmed) return;

    setDeletingId(project.id);
    setError('');
    setNotice('');
    try {
      await axios.delete(`/api/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('gameplan_token')}` },
      });
      setProjects((current) => current.filter(({ id }) => id !== project.id));
      setNotice('기획서를 삭제했습니다.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || '기획서를 삭제하지 못했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Page>
      <Content>
        <HeadingRow>
          <div>
            <Eyebrow>MY GAMEPLAN</Eyebrow>
            <Title>내 기획서</Title>
            <Description>내가 작성한 게임 기획서를 관리할 수 있어요.</Description>
          </div>
          <CreateLink to="/projects/new"><FiPlus aria-hidden="true" /> 새 기획서</CreateLink>
        </HeadingRow>

        <StatusLine>
          {status === 'ready' && <Count>{projects.length}<span>개의 기획서</span></Count>}
          {notice && <Notice role="status">{notice}</Notice>}
          {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
        </StatusLine>

        {status === 'loading' ? (
          <EmptyState role="status">내 기획서를 불러오는 중이에요.</EmptyState>
        ) : status === 'error' ? (
          <EmptyState>{error}</EmptyState>
        ) : projects.length === 0 ? (
          <EmptyState>
            <EmptyTitle>아직 작성한 기획서가 없어요.</EmptyTitle>
            <EmptyCopy>첫 기획서를 만들어 게임 아이디어를 정리해 보세요.</EmptyCopy>
            <EmptyCreateLink to="/projects/new">기획서 작성</EmptyCreateLink>
          </EmptyState>
        ) : (
          <ProjectList>
            {projects.map((project) => (
              <ProjectCard key={project.id}>
                <Cover $hasImage={Boolean(project.image)}>
                  {project.image && <CoverImage src={project.image} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />}
                  <Genre>{project.genre}</Genre>
                </Cover>
                <ProjectInfo>
                  <ProjectTitle>{project.title}</ProjectTitle>
                  <Overview>{project.overview}</Overview>
                  <Meta>작성자 {project.author} · {formatDate(project.created_at)}</Meta>
                  <Actions>
                    <ActionLink to={`/projects/${project.id}`}>상세 보기</ActionLink>
                    <ActionLink to={`/projects/${project.id}/edit`}>수정</ActionLink>
                    <DeleteButton type="button" disabled={deletingId === project.id} onClick={() => handleDelete(project)}>
                      {deletingId === project.id ? '삭제 중...' : '삭제'}
                    </DeleteButton>
                  </Actions>
                </ProjectInfo>
              </ProjectCard>
            ))}
          </ProjectList>
        )}
      </Content>
    </Page>
  );
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default MyProject;

const Page = styled.div`
  flex: 1;
  width: 100%;
  color: rgb(50, 50, 50);
  background: #fff;
`;

const Content = styled.div`
  width: min(100%, 1280px);
  margin: 0 auto;
  padding: 64px clamp(24px, 7vw, 100px) 88px;
  @media (max-width: 600px) { padding: 44px 20px 62px; }
`;

const HeadingRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  @media (max-width: 500px) { align-items: flex-start; flex-direction: column; }
`;

const Eyebrow = styled.div`color: #777; font-size: 10px; font-weight: 700; letter-spacing: 1.7px;`;

const Title = styled.h1`
  margin-top: 11px;
  color: rgb(50, 50, 50);
  font-size: clamp(28px, 4vw, 38px);
  font-weight: 800;
  letter-spacing: -1.3px;
`;

const Description = styled.p`margin-top: 9px; color: #777; font-size: 12px; line-height: 1.7;`;

const CreateLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 13px;
  border: 1px solid rgb(50, 50, 50);
  border-radius: 4px;
  background: rgb(50, 50, 50);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
`;

const StatusLine = styled.div`
  min-height: 28px;
  margin-top: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Count = styled.div`
  color: rgb(50, 50, 50);
  font-size: 19px;
  font-weight: 700;
  span { margin-left: 6px; color: #888; font-size: 11px; font-weight: 400; }
`;

const Notice = styled.p`color: #666; font-size: 11px;`;
const ErrorMessage = styled.p`color: #555; font-size: 11px;`;

const ProjectList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 12px;
`;

const ProjectCard = styled.article`
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid #e5e5e5;
  border-radius: 7px;
  background: #fff;
  transition: box-shadow .16s ease, border-color .16s ease;
  &:hover { border-color: #d4d4d4; box-shadow: 0 5px 16px rgba(0, 0, 0, .06); }
  @media (max-width: 680px) { grid-template-columns: 1fr; }
`;

const Cover = styled.div`
  min-height: 178px;
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #f1f1f1;
  &::before, &::after { content: ''; position: absolute; border: 1px solid #d8d8d8; border-radius: 50%; opacity: ${({ $hasImage }) => ($hasImage ? 0 : 1)}; }
  &::before { width: 120px; height: 120px; }
  &::after { width: 84px; height: 84px; }
  @media (max-width: 680px) { min-height: 150px; }
`;

const CoverImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Genre = styled.span`
  position: absolute;
  top: 11px;
  left: 11px;
  z-index: 1;
  padding: 5px 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  background: #fff;
  color: #555;
  font-size: 10px;
`;

const ProjectInfo = styled.div`
  min-width: 0;
  padding: 20px 22px 17px;
  display: flex;
  flex-direction: column;
  @media (max-width: 680px) { padding: 17px; }
`;

const ProjectTitle = styled.h2`
  color: rgb(50, 50, 50);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -.4px;
`;

const Overview = styled.p`
  min-height: 42px;
  margin-top: 9px;
  color: #777;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const Meta = styled.p`margin-top: 12px; color: #999; font-size: 10px;`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
  margin-top: auto;
  padding-top: 16px;
`;

const ActionLink = styled(Link)`
  padding: 8px 11px;
  border: 1px solid #dedede;
  border-radius: 4px;
  color: #555;
  font-size: 10px;
  font-weight: 600;
  &:hover { border-color: #888; color: rgb(50, 50, 50); }
`;

const DeleteButton = styled.button`
  padding: 8px 11px;
  border: 1px solid #dedede;
  border-radius: 4px;
  background: #fff;
  color: #666;
  font: inherit;
  font-size: 10px;
  font-weight: 600;
  &:hover { border-color: #888; color: rgb(50, 50, 50); }
  &:disabled { cursor: wait; opacity: .6; }
`;

const EmptyState = styled.div`
  margin-top: 12px;
  padding: 74px 20px;
  border: 1px dashed #d9d9d9;
  border-radius: 7px;
  color: #777;
  font-size: 13px;
  text-align: center;
`;

const EmptyTitle = styled.h2`color: #444; font-size: 16px;`;
const EmptyCopy = styled.p`margin-top: 8px; color: #888; font-size: 12px;`;

const EmptyCreateLink = styled(Link)`
  display: inline-block;
  margin-top: 18px;
  padding: 10px 13px;
  border-radius: 4px;
  background: rgb(50, 50, 50);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
`;
