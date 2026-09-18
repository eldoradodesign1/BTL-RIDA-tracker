import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { User, Shop } from './types';
import {
  getUsers, getShops, saveUsers, saveShops, refreshLeadsFromGoogleSheets,
  refreshCheckinsFromGoogleSheets, refreshReportsFromGoogleSheets, refreshUsersFromGoogleSheets,
  flushOfflineOutbox, getSyncPendingCount
} from './utils/storage';
import { fetchTableFromGoogleSheets } from './utils/appScriptApi';
import { RidaOpsApp } from './components/RidaOpsApp';
import { LoginScreen } from './components/LoginScreen';

const SYNC_KEY='rida_ops_last_sync';
const SYNC_INTERVAL=30*60*1000;

export default function App(){
  const [currentUser,setCurrentUser]=useState<User|null>(()=>{try{const raw=localStorage.getItem('rida_ops_user');return raw?JSON.parse(raw):null;}catch{return null;}});
  const [users,setUsers]=useState<User[]>(()=>getUsers());
  const [shops,setShops]=useState<Shop[]>(()=>getShops());
  const [online,setOnline]=useState(typeof navigator==='undefined'?true:navigator.onLine);
  const [syncPending,setSyncPending]=useState(0);

  const refreshData=useCallback(async(force=false)=>{
    const last=Number(localStorage.getItem(SYNC_KEY)||0);
    if(!force&&Date.now()-last<SYNC_INTERVAL){setUsers(getUsers());setShops(getShops());return;}
    try{
      await flushOfflineOutbox();
      const [u,s]=await Promise.all([
        fetchTableFromGoogleSheets<User>('users'),
        fetchTableFromGoogleSheets<Shop>('shops')
      ]);
      await Promise.all([refreshLeadsFromGoogleSheets(),refreshCheckinsFromGoogleSheets(),refreshReportsFromGoogleSheets()]);
      saveUsers(u);saveShops(s);
      localStorage.setItem(SYNC_KEY,String(Date.now()));
      setUsers(getUsers());setShops(getShops());
    }catch(e){console.warn('RIDA OPS sync failed',e);setUsers(getUsers());setShops(getShops());}
    setSyncPending(getSyncPendingCount());
  },[]);

  useEffect(()=>{void refreshData();const id=window.setInterval(()=>void refreshData(),SYNC_INTERVAL);const online=()=>{setOnline(true);void refreshData(true)};const offline=()=>setOnline(false);window.addEventListener('online',online);window.addEventListener('offline',offline);return()=>{clearInterval(id);window.removeEventListener('online',online);window.removeEventListener('offline',offline)}},[refreshData]);
  useEffect(()=>{const fn=(e:Event)=>{const d=(e as CustomEvent).detail;};window.addEventListener('rida-toast',fn);return()=>window.removeEventListener('rida-toast',fn)},[]);
  const login=(u:User)=>{setCurrentUser(u);localStorage.setItem('rida_ops_user',JSON.stringify(u));};
  const logout=()=>{setCurrentUser(null);localStorage.removeItem('rida_ops_user');};
  if(!currentUser)return <LoginScreen onLoginSuccess={login}/>;
  const live=users.find(u=>u.id===currentUser.id)||currentUser;
  return <><RidaOpsApp user={live} users={users} shops={shops} online={online} syncPendingCount={syncPending} onRefresh={(f)=>void refreshData(f)} onLogout={logout} onOpenSystemConfig={()=>{}} onSimulateRole={(role)=>{const target=users.find(u=>u.role===role);if(target){setCurrentUser({...target,role});localStorage.setItem('rida_ops_user',JSON.stringify({...target,role}))}}}/><div className="ops-toast-host"><CheckCircle2 size={14}/><CircleAlert size={14}/></div></>;
}
