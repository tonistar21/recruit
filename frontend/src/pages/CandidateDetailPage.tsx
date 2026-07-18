import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Empty, Loading, PageHeader } from '../components/States';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { Candidate, DocumentItem } from '../types';

type History={id:string;to_stage:string;author:string;comment?:string;created_at:string};
type Comment={id:string;body:string;author:string;created_at:string};

export function CandidateDetailPage(){
  const {id}=useParams(); const {can}=useAuth(); const nav=useNavigate(); const qc=useQueryClient(); const [text,setText]=useState('');
  const c=useQuery({queryKey:['candidate',id],queryFn:()=>api<Candidate>(`/candidates/by-id/${id}`)});
  const history=useQuery({queryKey:['history',id],queryFn:()=>api<History[]>(`/candidates/${id}/history`)});
  const comments=useQuery({queryKey:['comments',id],queryFn:()=>api<Comment[]>(`/candidates/${id}/comments`)});
  const documents=useQuery({queryKey:['documents',id],queryFn:()=>api<DocumentItem[]>(`/documents?candidate_id=${encodeURIComponent(id??'')}`),enabled:Boolean(id)});
  const archive=useMutation({mutationFn:()=>api(`/candidates/${id}/archive`,{method:'POST'}),onSuccess:async()=>{await qc.invalidateQueries({queryKey:['candidates']});nav('/candidates')}});
  const add=useMutation({mutationFn:()=>api(`/candidates/${id}/comments`,{method:'POST',body:JSON.stringify({body:text})}),onSuccess:async()=>{setText('');await qc.invalidateQueries({queryKey:['comments',id]})}});
  if(c.isLoading)return <Loading/>;
  if(c.isError||!c.data)return <Empty title="Кандидата не знайдено" text="Запис відсутній або недоступний."/>;
  return <><PageHeader title={`${c.data.last_name} ${c.data.first_name}`} subtitle={`${c.data.public_id} · ${c.data.stage.name}`} actions={can('candidates.archive')?<button className="button danger" onClick={()=>{if(confirm('Архівувати кандидата?'))archive.mutate()}}>Архівувати</button>:undefined}/>
    <div className="grid-2"><section className="panel detail-grid"><h2>Анкета</h2>{[['Email',c.data.email],['Телефон',c.data.phone],['Місто',c.data.city],['Спеціальність',c.data.speciality],['Статус',c.data.status],['Стан',c.data.state]].map(([label,value])=><div key={label}><small>{label}</small><b>{value||'Не вказано'}</b></div>)}</section><section className="panel"><h2>Історія етапів</h2>{history.data?.map(item=><article className="timeline" key={item.id}><b>{item.to_stage}</b><small>{item.author} · {new Date(item.created_at).toLocaleString('uk-UA')}</small><p>{item.comment}</p></article>)}</section></div>
    <section className="panel comments"><h2>Документи</h2>{documents.isError?<p className="field-error">{documents.error instanceof Error?documents.error.message:'Не вдалося завантажити документи'}</p>:!documents.data?.length?<p>Документів ще немає.</p>:<div className="document-list">{documents.data.map(document=><article className="document-row" key={document.id}><div><b>{document.original_name}</b><small>{document.category} · {(document.size_bytes/1024).toFixed(1)} КБ</small></div><span className="badge">{document.status}</span><a className="icon" href={`/api/v1/documents/${document.id}/download`} aria-label={`Скачати ${document.original_name}`}><Download/></a></article>)}</div>}</section>
    <section className="panel comments"><h2>Коментарі</h2>{comments.data?.map(item=><article key={item.id}><b>{item.author}</b><small>{new Date(item.created_at).toLocaleString('uk-UA')}</small><p>{item.body}</p></article>)}{can('candidates.update')&&<div className="comment-box"><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Робочий коментар"/><button className="button primary" disabled={!text.trim()||add.isPending} onClick={()=>add.mutate()}>Додати</button></div>}</section>
  </>;
}
