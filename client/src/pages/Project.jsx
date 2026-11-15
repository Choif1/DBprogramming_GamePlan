import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import styled from 'styled-components';
import { FiSearch } from 'react-icons/fi';

const Project = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');

  const handleCreateProject = () => {
    if (!isLoggedIn) {
      window.alert('기획서를 작성하려면 로그인이 필요합니다.');
      navigate('/login', { state: { from: { pathname: '/projects/new' } } });
      return;
    }
    navigate('/projects/new');
  };

  useEffect(() => {
    let isCurrent = true;

    axios.get('/api/projects')
      .then(({ data }) => {
        if (!isCurrent) return;
        setProjects(Array.isArray(data) ? data : []);
        setStatus('ready');
      })
      .catch((error) => {
        if (!isCurrent) return;
        setErrorMessage(error.response?.data?.message || '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
        setStatus('error');
      });

    return () => { isCurrent = false; };
  }, [reloadKey]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return projects.filter((project) => {
      const matchesQuery = !normalizedQuery || [project.title, project.genre, project.overview, project.author]
        .some((value) => String(value || '').toLocaleLowerCase().includes(normalizedQuery));
      return matchesQuery;
    });
  }, [projects, query]);

  return (
    <Page>
      <Content>
        <HeadingRow>
          <div>
            <Eyebrow>GAMEPLAN PROJECTS</Eyebrow>
            <Title>기획서 둘러보기</Title>
            <Description>다양한 게임 아이디어를 살펴보고 새로운 영감을 얻어 보세요.</Description>
          </div>
          <HeadingActions>
            <Count aria-live="polite">{filteredProjects.length}<span>개의 기획서</span></Count>
            <CreateProjectButton type="button" onClick={handleCreateProject}>+ 기획서 작성</CreateProjectButton>
          </HeadingActions>
        </HeadingRow>

        <Toolbar>
          <SearchBox>
            <FiSearch aria-hidden="true" />
            <SearchInput
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="기획서 제목, 장르, 작성자 검색"
              aria-label="기획서 검색"
            />
          </SearchBox>
        </Toolbar>

        {status === 'loading' ? (
          <EmptyState><EmptyTitle>기획서를 불러오는 중이에요.</EmptyTitle></EmptyState>
        ) : status === 'error' ? (
          <EmptyState>
            <EmptyTitle>{errorMessage}</EmptyTitle>
            <RetryButton type="button" onClick={() => { setStatus('loading'); setReloadKey((key) => key + 1); }}>다시 시도</RetryButton>
          </EmptyState>
        ) : filteredProjects.length > 0 ? (
          <ProjectGrid>
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} to={`/projects/${project.id}`} aria-label={`${project.title} 상세 보기`}>
                <Cover $hasImage={Boolean(project.image)} aria-hidden="true">
                  {project.image && <CoverImage src={project.image} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />}
                  <GenreBadge>{project.genre}</GenreBadge>
                </Cover>
                <CardBody>
                  <CardTitle>{project.title}</CardTitle>
                  <Summary>{project.overview}</Summary>
                  <CardFooter><Author>{project.author}</Author></CardFooter>
                </CardBody>
              </ProjectCard>
            ))}
          </ProjectGrid>
        ) : (
          <EmptyState>
            <EmptyTitle>검색 결과가 없어요.</EmptyTitle>
            <EmptyCopy>다른 검색어로 다시 찾아보세요.</EmptyCopy>
          </EmptyState>
        )}

        <Notice>공개된 게임 기획서를 최신순으로 보여줍니다.</Notice>
      </Content>
    </Page>
  );
};

export default Project;

const Page = styled.div`
  flex: 1;
  width: 100%;
  color: rgb(50, 50, 50);
  background: #fff;
`;

const Content = styled.section`
  width: min(100%, 1440px);
  margin: 0 auto;
  padding: 70px clamp(26px, 8vw, 120px) 90px;
  @media (max-width: 600px) { padding: 48px 22px 64px; }
`;

const HeadingRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  @media (max-width: 500px) { align-items: flex-start; flex-direction: column; gap: 14px; }
`;

const Eyebrow = styled.div`
  margin-bottom: 13px;
  color: #777;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.7px;
`;

const Title = styled.h1`
  font-size: clamp(28px, 4vw, 38px);
  font-weight: 800;
  letter-spacing: -1.4px;
`;

const Description = styled.p`
  margin-top: 10px;
  color: #777;
  font-size: 13px;
  line-height: 1.7;
`;

const Count = styled.div`
  color: rgb(50, 50, 50);
  font-size: 22px;
  font-weight: 700;
  white-space: nowrap;
  span { margin-left: 6px; color: #888; font-size: 11px; font-weight: 400; }
`;

const HeadingActions = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  @media (max-width: 500px) { width: 100%; justify-content: space-between; }
`;

const CreateProjectButton = styled.button`
  padding: 10px 13px;
  border: 1px solid rgb(50, 50, 50);
  border-radius: 4px;
  background: rgb(50, 50, 50);
  color: #fff;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  transition: background .15s, color .15s;
  &:hover { background: #fff; color: rgb(50, 50, 50); }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  margin-top: 38px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e7e7e7;
`;

const SearchBox = styled.label`
  width: min(100%, 460px);
  height: 42px;
  padding: 0 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #dedede;
  border-radius: 5px;
  color: #777;
  &:focus-within { border-color: #777; }
`;

const SearchInput = styled.input`
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  &::placeholder { color: #aaa; }
`;

const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-top: 25px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 560px) { grid-template-columns: 1fr; gap: 14px; }
`;

const ProjectCard = styled(Link)`
  display: block;
  color: inherit;
  text-decoration: none;
  overflow: hidden;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #fff;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  &:hover { transform: translateY(-4px); border-color: #d4d4d4; box-shadow: 0 9px 20px rgba(0, 0, 0, .08); }
`;

const Cover = styled.div`
  height: 150px;
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #f1f1f1;
  &::before, &::after { content: ''; position: absolute; border: 1px solid #d8d8d8; border-radius: 50%; }
  &::before { width: 120px; height: 120px; opacity: ${({ $hasImage }) => ($hasImage ? 0 : 1)}; }
  &::after { width: 84px; height: 84px; opacity: ${({ $hasImage }) => ($hasImage ? 0 : 1)}; }
`;

const CoverImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const GenreBadge = styled.span`
  position: absolute;
  z-index: 2;
  top: 12px;
  left: 12px;
  padding: 5px 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  background: #fff;
  color: #555;
  font-size: 10px;
`;

const CardBody = styled.div`
  padding: 17px 17px 14px;
`;

const CardTitle = styled.h2`
  overflow: hidden;
  color: rgb(50, 50, 50);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -.4px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Summary = styled.p`
  min-height: 40px;
  margin-top: 8px;
  color: #777;
  font-size: 12px;
  line-height: 1.7;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 15px;
  padding-top: 12px;
  border-top: 1px solid #eee;
`;

const Author = styled.span`
  overflow: hidden;
  color: #666;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RetryButton = styled.button`
  margin-top: 16px;
  padding: 9px 14px;
  border: 1px solid rgb(50, 50, 50);
  border-radius: 4px;
  background: rgb(50, 50, 50);
  color: #fff;
  font: inherit;
  font-size: 11px;
`;

const EmptyState = styled.div`
  margin-top: 26px;
  padding: 74px 20px;
  border: 1px dashed #d9d9d9;
  border-radius: 7px;
  text-align: center;
`;

const EmptyTitle = styled.h2`
  color: #444;
  font-size: 16px;
`;

const EmptyCopy = styled.p`
  margin-top: 8px;
  color: #888;
  font-size: 12px;
`;

const Notice = styled.p`
  margin-top: 20px;
  color: #999;
  font-size: 10px;
  line-height: 1.6;
  text-align: right;
`;
