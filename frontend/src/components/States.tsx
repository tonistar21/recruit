export function Loading({ label = 'Завантаження даних…' }: { label?: string }) { return <div className="state"><span className="spinner"/>{label}</div>; }
export function Empty({ title, text }: { title: string; text: string }) { return <div className="empty"><b>{title}</b><span>{text}</span></div>; }
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) { return <header className="page-header"><div><h1>{title}</h1><p>{subtitle}</p></div><div className="actions">{actions}</div></header>; }
