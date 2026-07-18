import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileUp, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Empty, Loading, PageHeader } from '../components/States';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { Candidate, DocumentItem, Page } from '../types';

const statuses: Record<string, string> = { uploaded:'Завантажено', under_review:'На перевірці', verified:'Підтверджено', needs_clarification:'Потребує уточнення', rejected:'Відхилено' };

export function DocumentsPage() {
  const { user, can } = useAuth(); const qc = useQueryClient(); const input = useRef<HTMLInputElement>(null);
  const [candidateId,setCandidateId]=useState(user?.candidate_id??''); const [category,setCategory]=useState('resume'); const [drag,setDrag]=useState(false);
  const isCandidate=user?.role==='candidate';
  const candidates=useQuery({queryKey:['document-candidates'],queryFn:()=>api<Page<Candidate>>('/candidates?page_size=100'),enabled:!isCandidate});
  const docs=useQuery({queryKey:['documents',candidateId],queryFn:()=>api<DocumentItem[]>(`/documents${candidateId?`?candidate_id=${encodeURIComponent(candidateId)}`:''}`)});
  const upload=useMutation({mutationFn:(file:File)=>{const body=new FormData();body.append('file',file);body.append('candidate_id',candidateId);body.append('category',category);return api('/documents',{method:'POST',body})},onSuccess:async()=>{if(input.current)input.current.value='';await qc.invalidateQueries({queryKey:['documents']});toast.success('Документ успішно завантажено')},onError:error=>toast.error(error instanceof Error?error.message:'Помилка завантаження')});
  const review=useMutation({mutationFn:({id,status}:{id:string;status:string})=>api(`/documents/${id}/review`,{method:'PATCH',body:JSON.stringify({status})}),onSuccess:()=>qc.invalidateQueries({queryKey:['documents']}),onError:error=>toast.error(error instanceof Error?error.message:'Не вдалося змінити статус')});
  const remove=useMutation({mutationFn:(id:string)=>api(`/documents/${id}`,{method:'DELETE'}),onSuccess:async()=>{await qc.invalidateQueries({queryKey:['documents']});toast.success('Документ видалено')},onError:error=>toast.error(error instanceof Error?error.message:'Не вдалося видалити документ')});
  const enabled=Boolean(candidateId)&&!upload.isPending; const accept=(file?:File)=>{if(file&&enabled)upload.mutate(file)};
  if(docs.isLoading)return <Loading/>;
  return <><PageHeader title={isCandidate?'Мої документи':'Документи'} subtitle="Приватне авторизоване файлове сховище"/><div className="document-controls">{!isCandidate&&<label>Кандидат<select value={candidateId} onChange={e=>setCandidateId(e.target.value)}><option value="">Усі кандидати</option>{candidates.data?.items.map(c=><option key={c.id} value={c.id}>{c.public_id} · {c.last_name} {c.first_name}</option>)}</select></label>}<label>Категорія<select value={category} onChange={e=>setCategory(e.target.value)}><option value="identity">Посвідчення особи</option><option value="resume">Резюме</option><option value="education">Освіта</option><option value="certificate">Сертифікат</option><option value="other">Інше</option></select></label></div>
  {can('documents.upload')&&<div className={`dropzone ${drag?'drag':''} ${enabled?'':'disabled'}`} onDragOver={e=>{e.preventDefault();if(enabled)setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);accept(e.dataTransfer.files[0])}} onClick={()=>enabled&&input.current?.click()} onKeyDown={e=>{if(enabled&&(e.key==='Enter'||e.key===' '))input.current?.click()}} role="button" tabIndex={enabled?0:-1} aria-disabled={!enabled}><FileUp/><b>{!candidateId?'Спочатку оберіть кандидата':upload.isPending?'Завантаження…':'Перетягніть файл або натисніть'}</b><span>PDF, JPG, PNG або TXT</span><input ref={input} hidden disabled={!enabled} type="file" accept=".pdf,.jpg,.jpeg,.png,.txt" onChange={e=>accept(e.target.files?.[0])}/></div>}
  {docs.isError?<Empty title="Не вдалося завантажити документи" text={docs.error instanceof Error?docs.error.message:'Помилка сервера'}/>:!docs.data?.length?<Empty title="Документів не знайдено" text="Оберіть кандидата або завантажте перший файл."/>:<div className="document-list">{docs.data.map(d=><article className="panel document-row" key={d.id}><div><b>{d.original_name}</b><small>{d.category} · {(d.size_bytes/1024).toFixed(1)} КБ</small></div><span className="badge">{statuses[d.status]??d.status}</span>{can('documents.verify')&&<select value={d.status} onChange={e=>review.mutate({id:d.id,status:e.target.value})}>{Object.entries(statuses).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>}<a className="icon" href={`/api/v1/documents/${d.id}/download`} aria-label={`Скачати ${d.original_name}`}><Download/></a>{can('documents.upload')&&<button className="icon danger-icon" onClick={()=>{if(confirm('Видалити документ?'))remove.mutate(d.id)}} aria-label={`Видалити ${d.original_name}`}><Trash2/></button>}</article>)}</div>}</>;
}
