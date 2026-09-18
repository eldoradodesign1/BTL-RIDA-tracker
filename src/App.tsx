import React,{useCallback,useEffect,useState} from 'react';
import {CheckCircle2,CircleAlert} from 'lucide-react';
import {User,Shop,UserRole} from './types';
import {getUsers,getShops,saveUsers,saveShops,refreshLeadsFromGoogleSheets,refreshCheckinsFromGoogleSheets,refreshReportsFromGoogleSheets,refreshUsersFromGoogleSheets,flushOfflineOutbox,getSyncPendingCount} from './utils/storage';
import {fetchTableFromGoogleSheets} from './utils/appScriptApi';
import {RidaOpsApp} from './components/RidaOpsApp';
import {LoginScreen} from './components/LoginScreen';
import {SystemConfigurationModal} from './components/Modals/SystemConfigurationModal';

const SYNC_KEY='rida_ops_last_sync'; const SYNC_INTERVAL=30*60*1000;

export default function App(){
 const [masterUser,setMasterUser]=useState<User|null>(()=>{try{const raw=localStorage.getItem('rida_ops_master');return raw?JSON.parse(raw):null}catch{return null}});
 const [currentUser,setCurrentUser]=useState<User|null>(()=>{try{const raw=localStorage.getItem('rida_ops_user');return raw?JSON.parse(raw):null}catch{return null}});
 const [users,setUsers]=useState<User[]>(()=>getUsers()); const [shops,setShops]=useState<Shop[]>(()=>getShops());
 const [online,setOnline]=useState(typeof navigator==='undefined'?true:navigator.onLine); const [syncPending,setSyncPending]=useState(0);
 const [configOpen,setConfigOpen]=useState(false);
 const refreshData=useCallback(async(force=false)=>{const last=Number(localStorage.getItem(SYNC_KEY)||0);if(!force&&Date.now()-last<SYNC_INTERVAL){setUsers(getUsers());setShops(getShops());setSyncPending(getSyncPendingCount());return}try{await flushOfflineOutbox();const [u,s]=await Promise.all([fetchTableFromGoogleSheets<User>('users'),fetchTableFromGoogleSheets<Shop>('shops')]);await Promise.all([refreshLeadsFromGoogleSheets(),refreshCheckinsFromGoogleSheets(),refreshReportsFromGoogleSheets()]);saveUsers(u);saveShops(s);localStorage.setItem(SYNC_KEY,String(Date.now()));setUsers(getUsers());setShops(getShops())}catch(e){console.warn('RIDA OPS sync failed',e);setUsers(getUsers());setShops(getShops())}setSyncPending(getSyncPendingCount())},[]);
 useEffect(()=>{void refreshData();const id=window.setInterval(()=>void refreshData(),SYNC_INTERVAL);const goOnline=()=>{setOnline(true);void refreshData(true)};const goOffline=()=>setOnline(false);window.addEventListener('online',goOnline);window.addEventListener('offline',goOffline);return()=>{clearInterval(id);window.removeEventListener('online',goOnline);window.removeEventListener('offline',goOffline)}},[refreshData]);
 useEffect(()=>{const onToast=()=>{};window.addEventListener('rida-toast',onToast);return()=>window.removeEventListener('rida-toast',onToast)},[]);
 useEffect(()=>{if(!currentUser)return;const fresh=users.find(u=>u.id===currentUser.id);if(fresh&&fresh!==currentUser)setCurrentUser(fresh)},[users]);
 const login=(u:User)=>{setMasterUser(u);setCurrentUser(u);localStorage.setItem('rida_ops_master',JSON.stringify(u));localStorage.setItem('rida_ops_user',JSON.stringify(u))};
 const logout=()=>{setCurrentUser(null);setMasterUser(null);localStorage.removeItem('rida_ops_user');localStorage.removeItem('rida_ops_master')};
 const simulate=(role:UserRole)=>{if(!masterUser||masterUser.role!=='super_admin')return;const target=users.find(u=>u.role===role&&u.id!==masterUser.id)||users.find(u=>u.role===role);if(!target)return;const simulated={...target,role};setCurrentUser(simulated);localStorage.setItem('rida_ops_user',JSON.stringify(simulated))};
 const exitSimulation=()=>{if(masterUser){setCurrentUser(masterUser);localStorage.setItem('rida_ops_user',JSON.stringify(masterUser))}};
 if(!currentUser)return <LoginScreen onLoginSuccess={login}/>;
 const effectiveIsSim=!!masterUser&&masterUser.role==='super_admin'&&currentUser.id!==masterUser.id;
 return <><RidaOpsApp user={currentUser} users={users} shops={shops} online={online} syncPendingCount={syncPending} onRefresh={(f)=>void refreshData(f)} onLogout={logout} onOpenSystemConfig={()=>setConfigOpen(true)} onSimulateRole={simulate} simulationActive={effectiveIsSim} onExitSimulation={exitSimulation}/>{configOpen&&<SystemConfigurationModal isOpen currentUser={masterUser||currentUser} onClose={()=>setConfigOpen(false)} onRefreshData={()=>{void refreshData(true)}}/>}<div className="ops-toast-host"><CheckCircle2 size={14}/><CircleAlert size={14}/></div></>;
}
