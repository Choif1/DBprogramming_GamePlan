import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import styled from 'styled-components';
import { FiArrowLeft, FiImage } from 'react-icons/fi';

const projectFields = [
  { name: 'overview', label: '기획 개요', placeholder: '게임의 핵심 아이디어와 목표를 소개해 주세요.' },
  { name: 'gameplay', label: '게임플레이', placeholder: '플레이어가 게임에서 무엇을 하고 어떤 경험을 하는지 설명해 주세요.' },
  { name: 'gamesystem', label: '게임 시스템', placeholder: '규칙, 성장, 전투 등 주요 시스템을 적어 주세요.' },
  { name: 'story', label: '스토리', placeholder: '게임의 배경과 이야기를 소개해 주세요.' },
  { name: 'features', label: '주요 특징', placeholder: '이 게임만의 차별점과 핵심 특징을 적어 주세요.' },
];

const ProjectCreate = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn, setCurrentUser } = useOutletContext();
  const [form, setForm] = useState({
    title: '', genre: '', overview: '', gameplay: '', gamesystem: '', story: '', features: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!image) {
      setImagePreview('');
      return undefined;
    }
    const previewUrl = URL.createObjectURL(image);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [image]);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  };

  const selectImage = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('JPG, PNG, WEBP, GIF 이미지 파일만 올릴 수 있어요.');
      event.target.value = '';
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('이미지는 5MB 이하로 올려 주세요.');
      event.target.value = '';
      return;
    }
    setImage(selectedFile);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    const projectData = new FormData();
    Object.entries(form).forEach(([key, value]) => projectData.append(key, value.trim()));
    if (image) projectData.append('image', image);

    try {
      const { data } = await axios.post('/api/projects', projectData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('gameplan_token')}` },
      });
      navigate(`/projects/${data.projectId}`);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('gameplan_token');
        localStorage.removeItem('gameplan_user');
        setIsLoggedIn(false);
        setCurrentUser(null);
        navigate('/login', { replace: true });
        return;
      }
      setError(requestError.response?.data?.message || '기획서를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <Content>
        <BackLink to="/projects"><FiArrowLeft aria-hidden="true" /> 기획서 목록</BackLink>
        <Heading>
          <Eyebrow>CREATE A PROJECT</Eyebrow>
          <Title>새 기획서 작성</Title>
          <Description>게임 아이디어를 각 항목에 맞춰 정리해 보세요.</Description>
        </Heading>

        <Form onSubmit={handleSubmit}>
          <TopFields>
            <Field>
              <Label htmlFor="title">기획서 제목</Label>
              <Input id="title" name="title" value={form.title} onChange={updateField} maxLength={100} placeholder="예: 별을 잇는 항해자" required />
            </Field>
            <Field>
              <Label htmlFor="genre">장르</Label>
              <Input id="genre" name="genre" value={form.genre} onChange={updateField} maxLength={50} placeholder="예: 어드벤처 RPG" required />
            </Field>
          </TopFields>

          <Field>
            <Label htmlFor="image">대표 이미지 <Optional>선택</Optional></Label>
            <ImagePicker>
              {imagePreview ? <Preview src={imagePreview} alt="업로드할 대표 이미지 미리보기" /> : <ImagePlaceholder><FiImage aria-hidden="true" /><span>이미지를 선택해 주세요.</span></ImagePlaceholder>}
              <ImageControls>
                <ImageInput id="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={selectImage} />
                {image && <FileName>{image.name}</FileName>}
                {image && <RemoveImage type="button" onClick={() => setImage(null)}>이미지 제거</RemoveImage>}
                <ImageHint>JPG, PNG, WEBP, GIF · 최대 5MB</ImageHint>
              </ImageControls>
            </ImagePicker>
          </Field>

          {projectFields.map(({ name, label, placeholder }) => (
            <Field key={name}>
              <Label htmlFor={name}>{label}</Label>
              <Textarea id={name} name={name} value={form[name]} onChange={updateField} placeholder={placeholder} rows={5} required />
            </Field>
          ))}

          {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
          <FormActions>
            <CancelLink to="/projects">취소</CancelLink>
            <SubmitButton type="submit" disabled={isSubmitting}>{isSubmitting ? '등록 중...' : '기획서 등록'}</SubmitButton>
          </FormActions>
        </Form>
      </Content>
    </Page>
  );
};

export default ProjectCreate;

const Page = styled.div`
  flex: 1;
  width: 100%;
  background: #fafafa;
  color: rgb(50, 50, 50);
`;

const Content = styled.div`
  width: min(100%, 1080px);
  margin: 0 auto;
  padding: 38px clamp(24px, 7vw, 90px) 84px;
  @media (max-width: 560px) { padding: 28px 18px 58px; }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #666;
  font-size: 12px;
  &:hover { color: rgb(50, 50, 50); }
`;

const Heading = styled.div`margin-top: 32px;`;
const Eyebrow = styled.div`color: #777; font-size: 10px; font-weight: 700; letter-spacing: 1.7px;`;

const Title = styled.h1`
  margin-top: 10px;
  color: rgb(50, 50, 50);
  font-size: clamp(27px, 4vw, 36px);
  font-weight: 800;
  letter-spacing: -1.2px;
`;

const Description = styled.p`margin-top: 9px; color: #777; font-size: 12px; line-height: 1.7;`;

const Form = styled.form`
  margin-top: 30px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 23px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, .035);
  @media (max-width: 560px) { padding: 22px 17px; gap: 20px; }
`;

const TopFields = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 18px;
  @media (max-width: 560px) { grid-template-columns: 1fr; gap: 20px; }
`;

const Field = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const Label = styled.label`color: #444; font-size: 12px; font-weight: 700;`;
const Optional = styled.span`margin-left: 5px; color: #999; font-size: 10px; font-weight: 400;`;

const Input = styled.input`
  width: 100%;
  height: 43px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  color: rgb(50, 50, 50);
  font: inherit;
  font-size: 13px;
  &:focus { border-color: #777; box-shadow: 0 0 0 2px rgba(0, 0, 0, .05); }
  &::placeholder { color: #aaa; }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 130px;
  padding: 12px;
  resize: vertical;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  color: rgb(50, 50, 50);
  font: inherit;
  font-size: 13px;
  line-height: 1.7;
  &:focus { border-color: #777; box-shadow: 0 0 0 2px rgba(0, 0, 0, .05); }
  &::placeholder { color: #aaa; }
`;

const ImagePicker = styled.div`
  min-height: 156px;
  padding: 13px;
  display: flex;
  align-items: center;
  gap: 17px;
  border: 1px dashed #d5d5d5;
  border-radius: 5px;
  background: #fcfcfc;
  @media (max-width: 560px) { align-items: flex-start; flex-direction: column; }
`;

const ImagePlaceholder = styled.div`
  width: 190px;
  height: 128px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f1f1f1;
  color: #888;
  font-size: 11px;
  svg { font-size: 20px; }
`;

const Preview = styled.img`
  width: 190px;
  height: 128px;
  border: 1px solid #e2e2e2;
  background: #f1f1f1;
  object-fit: cover;
`;

const ImageControls = styled.div`display: flex; flex-direction: column; align-items: flex-start; gap: 9px;`;

const ImageInput = styled.input`
  max-width: 100%;
  color: #666;
  font: inherit;
  font-size: 11px;
  &::file-selector-button {
    margin-right: 8px;
    padding: 8px 10px;
    border: 1px solid #d8d8d8;
    border-radius: 4px;
    background: #fff;
    color: #444;
    cursor: pointer;
  }
`;

const FileName = styled.span`max-width: 330px; overflow: hidden; color: #555; font-size: 10px; text-overflow: ellipsis; white-space: nowrap;`;
const ImageHint = styled.span`color: #999; font-size: 10px;`;

const RemoveImage = styled.button`
  padding: 0;
  background: transparent;
  color: #777;
  font: inherit;
  font-size: 10px;
  text-decoration: underline;
  text-underline-offset: 2px;
`;

const ErrorMessage = styled.p`color: #555; font-size: 12px; line-height: 1.6;`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
`;

const CancelLink = styled(Link)`
  padding: 11px 15px;
  color: #666;
  font-size: 12px;
`;

const SubmitButton = styled.button`
  padding: 11px 17px;
  border: 1px solid rgb(50, 50, 50);
  border-radius: 4px;
  background: rgb(50, 50, 50);
  color: #fff;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  &:disabled { cursor: wait; opacity: .65; }
`;
