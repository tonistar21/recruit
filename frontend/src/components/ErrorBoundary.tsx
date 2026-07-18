import { Component,type ReactNode } from 'react';

export class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return{failed:true}}
  render(){
    if(this.state.failed)return <main className="route-error"><b>500</b><h1>Сталася непередбачена помилка</h1><button className="button primary" onClick={()=>location.reload()}>Перезавантажити</button></main>;
    return this.props.children;
  }
}
