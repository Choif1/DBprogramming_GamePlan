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
