"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// SUPABASE YAPILANDIRMASI (CANLI)
// ═══════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js';

// ⚠️ API anahtarlarını .env.local dosyasına taşıyın:
// NEXT_PUBLIC_SUPABASE_URL=https://ncebtxitvbbekbehesxy.supabase.co
// NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ncebtxitvbbekbehesxy.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZWJ0eGl0dmJiZWtiZWhlc3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Mzg1NTMsImV4cCI6MjA4ODAxNDU1M30.RY2MYXMxhE1EC92ZW0SY3anf2ci-mHhGy2fuup-eZiU'
);

export async function uploadProductImage(file, storeId) {
  const ext = file.name.split('.').pop();
  const path = `${storeId}/${Date.now()}.${ext}`;
  
  // 'products' bucket isminin doğruluğundan emin olun
  const { error } = await supabase.storage.from('products').upload(path, file, { 
    cacheControl: '3600', 
    upsert: false 
  });
  
  if (error) throw error;
  
  const { data } = supabase.storage.from('products').getPublicUrl(path);
  return data.publicUrl;
}

export async function saveProduct({ name, price, imageUrl, storeId, phone }) {
  const { data, error } = await supabase.from('products')
    .insert([{ 
      name, 
      price: parseFloat(price), 
      image_url: imageUrl, 
      store_id: storeId, 
      whatsapp_number: phone 
    }])
    .select().single();
    
  if (error) throw error;
  return data;
}

// Fetch products for a given storeId from Supabase
export async function fetchProducts(storeId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Format timestamp to 'time ago' format (e.g., '2h', '3d', '1g')
function getTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = new Date();
  const time = new Date(timestamp);
  const seconds = Math.floor((now - time) / 1000);
  
  if (seconds < 60) return 'Şimdi';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}d`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}s`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}g`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}h`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}ay`;
  const years = Math.floor(months / 12);
  return `${years}y`;
}

// Check if username is available on Supabase
async function checkUsernameAvailability(username) {
  if (!username) return { available: true };
  try {
    const sanitized = username.toLowerCase().replace(/[^a-z0-9._]/g, '');
    const { data } = await supabase
      .from('stores')
      .select('id')
      .eq('username', sanitized)
      .limit(1);
    return { available: !data || data.length === 0, sanitized };
  } catch (err) {
    console.error("Username check error:", err);
    return { available: true };
  }
}

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const T = {
  bg:"#09090f", surface:"#111118", card:"#15151e", raised:"#1b1b26",
  border:"#1e1e2e", border2:"#29293b",
  text:"#ede9ff", text2:"#9290a8", muted:"#5a5870", dim:"#302e48",
  brand:"#8875f5", brandDim:"#8875f514", brandBorder:"#8875f530",
  teal:"#34d4b0", amber:"#f5a623", rose:"#ef7070", green:"#52d98b",
  wa:"#25D366", gold:"#f5c54a",
  gradBrand:"linear-gradient(135deg,#8875f5 0%,#c084fc 55%,#f472b6 100%)",
  gradStory:"linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
};

// ═══════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════
const STORES = [
  { id:"st1", username:"atlaz_studio", name:"Atlaz Studio",
    avatar:"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80",
    verified:true, followers:4820, city:"İstanbul",
    bio:"Premium tekstil · Viskon uzmanı · Toptan sipariş alıyoruz",
    phone:"905321234567", private:false, collections:["İlkbahar 2026","Klasik Seri","Yaz"] },
  { id:"st2", username:"denim_republic", name:"Denim Republic",
    avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80",
    verified:true, followers:3210, city:"İzmir",
    bio:"Denim uzmanı · Oversize koleksiyon · Min. 12 adet",
    phone:"905339876543", private:false, collections:["Denim SS26","Kargo"] },
  { id:"st3", username:"pastel_mode", name:"PastelMode",
    avatar:"https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&q=80",
    verified:false, followers:1890, city:"Ankara",
    bio:"Pastel tonlar · Kadın giyim",
    phone:"905351112233", private:true, collections:["Pastel"] },
  { id:"st4", username:"koza_giyim", name:"Koza Giyim",
    avatar:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80",
    verified:false, followers:980, city:"Bursa",
    bio:"Erkek giyim · Polo & basic",
    phone:"905362223344", private:false, collections:["Erkek Basic"] },
];

const INIT_PRODUCTS = [
  { id:"p1", storeId:"st1", name:"Viskon Midi Elbise", price:"285",
    media:[{ type:"image", url:"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=85" },
           { type:"image", url:"https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=85" }],
    description:"Nefes alan viskon, 6 renk. Min. lot: 12 adet.",
    collection:"İlkbahar 2026", tags:["viskon","elbise","kadın","toptan"],
    likes:1284, liked:false, saved:false, inStock:true, timeAgo:"2s", createdAt: new Date(Date.now() - 2*3600000).toISOString(),
    storeVerified:true, storeUsername:"atlaz_studio",
    storeAvatar:"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80",
    storePhone:"905321234567", storeCity:"İstanbul", storeName:"Atlaz Studio" },
  { id:"p2", storeId:"st2", name:"Oversize Kargo Şort", price:"145",
    media:[{ type:"video", url:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
             thumb:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=85" }],
    description:"4 renk, S-XXL. Standart lot: 24 adet.",
    collection:"Denim SS26", tags:["denim","şort","oversize","erkek"],
    likes:876, liked:false, saved:false, inStock:true, timeAgo:"5s", createdAt: new Date(Date.now() - 5*60000).toISOString(),
    storeVerified:true, storeUsername:"denim_republic",
    storeAvatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80",
    storePhone:"905339876543", storeCity:"İzmir", storeName:"Denim Republic" },
  { id:"p3", storeId:"st3", name:"Pastel Keten Bluz", price:"190",
    media:[{ type:"image", url:"https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&q=85" },
           { type:"image", url:"https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=85" }],
    description:"5 pastel renk, S-XL. Hafif keten.",
    collection:"Pastel", tags:["keten","bluz","pastel","kadın"],
    likes:2103, liked:true, saved:true, inStock:false, timeAgo:"1g", createdAt: new Date(Date.now() - 24*3600000).toISOString(),
    storeVerified:false, storeUsername:"pastel_mode",
    storeAvatar:"https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&q=80",
    storePhone:"905351112233", storeCity:"Ankara", storeName:"PastelMode" },
  { id:"p4", storeId:"st4", name:"Polo Yaka Tişört", price:"95",
    media:[{ type:"image", url:"https://images.unsplash.com/photo-1594938298603-c8148c4b4d7b?w=600&q=85" }],
    description:"6 renk, S-XXL. Solmaz baskı.",
    collection:"Erkek Basic", tags:["polo","erkek","basic","toptan"],
    likes:541, liked:false, saved:false, inStock:true, timeAgo:"2g", createdAt: new Date(Date.now() - 48*3600000).toISOString(),
    storeVerified:false, storeUsername:"koza_giyim",
    storeAvatar:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80",
    storePhone:"905362223344", storeCity:"Bursa", storeName:"Koza Giyim" },
];

const STORIES = [
  { id:"s1", username:"atlaz_studio", avatar:"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80", seen:false },
  { id:"s2", username:"denim_rep",    avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80", seen:false },
  { id:"s3", username:"pastel_mod",   avatar:"https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&q=80", seen:true },
  { id:"s4", username:"koza_giyim",   avatar:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80", seen:false },
];

const INIT_MESSAGES = [
  { id:"m1", storeId:"st1", storeName:"Atlaz Studio",
    storeAvatar:"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80",
    last:"Toptan fiyatı ne kadar?", time:"2dk", unread:2,
    messages:[
      { id:"msg1", from:"me", text:"Merhaba! Viskon elbise için toptan fiyat alabilir miyim?", time:"10:30" },
      { id:"msg2", from:"store", text:"Merhaba! 12 adetlik lot için 240₺/adet yapabiliriz.", time:"10:35" },
    ]},
  { id:"m2", storeId:"st2", storeName:"Denim Republic",
    storeAvatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80",
    last:"Stokta var, DM atın", time:"1s", unread:0,
    messages:[
      { id:"msg3", from:"store", text:"Merhaba, nasıl yardımcı olabilirim?", time:"09:00" },
    ]},
];

// ═══════════════════════════════════════════════════════════════
// ICON PATHS
// ═══════════════════════════════════════════════════════════════
const IP = {
  home_f:"M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  home_o:"M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  search:"M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  plus:"M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  cart_o:"M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 5.9 17 7 17h11v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H17c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 21.46 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z",
  cart_f:"M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 5.9 17 7 17h11v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H17c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 21.46 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z",
  msg_o:"M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z",
  msg_f:"M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z",
  person_o:"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  person_f:"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  heart_o:"M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z",
  heart_f:"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  save_o:"M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15-5-2.18L7 18V5h10v13z",
  save_f:"M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z",
  share:"M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 21 6a3 3 0 0 0-6 0c0 .24.04.47.09.7L8.04 10.81C7.5 10.32 6.84 10 6.1 10c-1.66 0-3 1.34-3 3s1.34 3 3 3c.74 0 1.4-.32 1.93-.82l7.14 4.16c-.05.22-.08.45-.08.68A2.99 2.99 0 1 0 18 16.08z",
  close:"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  check:"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z",
  edit:"M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  lock:"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
  photo:"M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
  phone:"M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  tag:"M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z",
  trash:"M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  arrow:"M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
  more:"M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  play:"M8 5v14l11-7z",
  mute:"M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z",
  sound:"M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
  video:"M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z",
  wa:"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.528 5.852L0 24l6.335-1.652A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0",
  dm:"M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z",
  settings:"M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.1-.62l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.1.62l2.03 1.58c-.05.3-.07.61-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.1.62l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.1-.62l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
  location:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z",
  bell:"M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
  mail:"M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
};

// ═══════════════════════════════════════════════════════════════
// BASE COMPONENTS
// ═══════════════════════════════════════════════════════════════
// SVG Logo
const Logo = ({ size=36 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius:10, flexShrink:0 }}>
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8875f5"/>
        <stop offset="1" stopColor="#f472b6"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="20" fill="url(#logoGrad)"/>
    <path d="M25 35H75V45H25V35Z" fill="white"/>
    <path d="M35 50H65V60H35V50Z" fill="white"/>
    <path d="M45 65H55V75H45V65Z" fill="white"/>
  </svg>
);

// small reusable icon component used throughout the UI
const Ic = ({ n, color = "#000", size = 24, filled, sx = {} }) => {
  const d = filled ? (IP[n + "_f"] || IP[n]) : (IP[n + "_o"] || IP[n]);
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0, ...sx }}>
      <path
        d={d}
        fill={filled ? color : "none"}
        stroke={filled ? "none" : color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const VBadge = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
    <circle cx="12" cy="12" r="12" fill={T.gold}/>
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#1a1200"/>
  </svg>
);

const Ring = ({ src, size=56, seen=false, onClick }) => (
  <div onClick={onClick} style={{ cursor:onClick?"pointer":"default", flexShrink:0,
    width:size+6, height:size+6, borderRadius:"50%", padding:3,
    background:seen?T.dim:T.gradStory, display:"flex", alignItems:"center", justifyContent:"center" }}>
    <img src={src} style={{ width:size, height:size, borderRadius:"50%",
      border:`2.5px solid ${T.bg}`, objectFit:"cover", display:"block" }}/>
  </div>
);

const Btn = ({ children, onClick, v="solid", color, full, size="md", disabled, sx={} }) => {
  const c = color || T.brand;
  const styles = {
    solid:{ background:disabled?T.dim:c, color:"#fff", border:"none" },
    outline:{ background:"transparent", color:c, border:`1.5px solid ${c}` },
    ghost:{ background:`${c}14`, color:c, border:"none" },
  }[v];
  const pad = { sm:"6px 14px", md:"10px 20px", lg:"13px 0" }[size];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles, padding:pad, borderRadius:11, fontSize:13, fontWeight:700,
      cursor:disabled?"not-allowed":"pointer", opacity:disabled?.5:1,
      width:full?"100%":"auto", display:"flex", alignItems:"center",
      justifyContent:"center", gap:7, fontFamily:"inherit", transition:"all .15s", ...sx
    }}>{children}</button>
  );
};

const Field = ({ label, value, onChange, type="text", placeholder, icon, multi, disabled, sx={} }) => (
  <div style={sx}>
    {label && <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5,
      textTransform:"uppercase", letterSpacing:.5 }}>{label}</div>}
    <div style={{ display:"flex", alignItems:multi?"flex-start":"center", background:disabled?T.border:T.raised,
      border:`1.5px solid ${disabled?T.border:T.border2}`, borderRadius:12, padding:"0 14px", gap:10 }}>
      {icon && <Ic n={icon} size={17} color={T.muted} sx={{ marginTop:multi?13:0 }}/>}
      {multi
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3}
            disabled={disabled}
            style={{ flex:1, background:"none", border:"none", outline:"none", padding:"12px 0",
              color:disabled?T.muted:T.text, fontSize:14, resize:"none", fontFamily:"inherit", lineHeight:1.6, cursor:disabled?"not-allowed":"text" }}/>
        : <input value={value} onChange={e=>onChange(e.target.value)} type={type} placeholder={placeholder}
            disabled={disabled}
            style={{ flex:1, background:"none", border:"none", outline:"none", padding:"12px 0",
              color:disabled?T.muted:T.text, fontSize:14, fontFamily:"inherit", cursor:disabled?"not-allowed":"text" }}/>
      }
    </div>
  </div>
);


// ═══════════════════════════════════════════════════════════════
// TOAST — alert() yerine kullan
// ═══════════════════════════════════════════════════════════════
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type="info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);
  const ToastContainer = () => (
    <div style={{ position:"absolute", top:60, left:0, right:0, zIndex:9999,
      display:"flex", flexDirection:"column", gap:6, padding:"0 14px", pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type==="error" ? T.rose : t.type==="success" ? T.green : T.raised,
          color:"#fff", borderRadius:10, padding:"10px 14px", fontSize:13, fontWeight:700,
          boxShadow:"0 4px 16px rgba(0,0,0,.4)", animation:"fadeUp .25s ease",
          border:`1px solid ${t.type==="error"?T.rose:t.type==="success"?T.green:T.border2}` }}>
          {t.type==="error"?"⚠️ ":t.type==="success"?"✓ ":""}{t.msg}
        </div>
      ))}
    </div>
  );
  return { show, ToastContainer };
}

// Contact Modal
function ContactModal({ store, onClose }) {
  const text = encodeURIComponent(`Merhaba ${store.name}! Ürünleriniz hakkında bilgi almak istiyorum.`);
  return (
    <div style={{ position:"absolute", inset:0, zIndex:300, background:"rgba(0,0,0,.7)",
      display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", background:T.surface,
        borderRadius:"20px 20px 0 0", padding:"20px 16px 36px",
        border:`1px solid ${T.border2}` }}>
        <div style={{ width:36, height:4, background:T.dim, borderRadius:2, margin:"0 auto 20px" }}/>
        <div style={{ fontWeight:800, fontSize:15, color:T.text, marginBottom:16 }}>
          {store.name} ile İletişim
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <a href={`https://wa.me/${store.phone}?text=${text}`} target="_blank" rel="noreferrer"
            style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
              background:T.wa, borderRadius:12, textDecoration:"none", color:"#fff", fontWeight:700, fontSize:14 }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="#fff"><path d={IP.wa}/></svg>
            WhatsApp ile Mesaj Gönder
          </a>
          <a href={`tel:+${store.phone}`}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
              background:T.brandDim, border:`1.5px solid ${T.brandBorder}`,
              borderRadius:12, textDecoration:"none", color:T.brand, fontWeight:700, fontSize:14 }}>
            <Ic n="phone" size={22} color={T.brand}/>
            Mağazayı Ara (+{store.phone})
          </a>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VIDEO PLAYER (Reels/Feed video)
// ═══════════════════════════════════════════════════════════════
function VideoPlayer({ url, thumb, autoPlay=true }) {
  const ref = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(autoPlay);

  useEffect(() => {
    if (!ref.current) return;
    if (playing) ref.current.play().catch(()=>{});
    else ref.current.pause();
  }, [playing]);

  const toggle = (e) => { e.stopPropagation(); setPlaying(p=>!p); };
  const toggleMute = (e) => { e.stopPropagation(); setMuted(m=>!m); if(ref.current) ref.current.muted = !muted; };

  return (
    <div style={{ position:"relative", width:"100%", aspectRatio:"1/1", background:"#000" }}>
      <video ref={ref} src={url} poster={thumb} muted loop playsInline
        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
        onClick={toggle}/>
      {/* play/pause overlay */}
      {!playing && (
        <div onClick={toggle} style={{ position:"absolute", inset:0, display:"flex",
          alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <div style={{ width:60, height:60, borderRadius:30, background:"rgba(0,0,0,.5)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ic n="play" size={30} color="#fff" filled/>
          </div>
        </div>
      )}
      {/* Mute toggle */}
      <button onClick={toggleMute} style={{ position:"absolute", bottom:10, right:10,
        width:32, height:32, borderRadius:16, background:"rgba(0,0,0,.6)",
        border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Ic n={muted?"mute":"sound"} size={16} color="#fff"/>
      </button>
      {/* Video badge */}
      <div style={{ position:"absolute", top:10, left:10, background:"rgba(0,0,0,.6)",
        borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:700, color:"#fff",
        display:"flex", alignItems:"center", gap:4 }}>
        <Ic n="video" size={12} color="#fff"/> Reels
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// ONBOARDING — 3 sayfalık tanıtım (sadece ilk açılışta)
// ═══════════════════════════════════════════════════════════════
const ONBOARD_SLIDES = [
  {
    emoji: "🏪",
    title: "Toptan Giyime Hoş Geldiniz",
    sub: "Türkiye'nin en büyük B2B toptan giyim platformu. Mağazaları keşfet, doğrudan irtibata geç.",
    color: "#8875f5"
  },
  {
    emoji: "🛒",
    title: "Kolayca Sipariş Ver",
    sub: "Beğendiğin ürünleri sepete ekle. Farklı renkler ve bedenler tek tıkla. WhatsApp ile tamamla.",
    color: "#34d4b0"
  },
  {
    emoji: "💬",
    title: "Direkt İletişim",
    sub: "Mağazalarla uygulama içi mesajlaşın. Fiyat teklifi isteyin. Lot anlaşmaları yapın.",
    color: "#f472b6"
  }
];

function Onboarding({ onDone }) {
  const [idx, setIdx] = useState(0);
  const slide = ONBOARD_SLIDES[idx];
  const last = idx === ONBOARD_SLIDES.length - 1;

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column",
      background:T.bg, position:"relative", overflow:"hidden" }}>
      {/* Skip */}
      <div style={{ padding:"16px 20px 0", display:"flex", justifyContent:"flex-end" }}>
        <button onClick={onDone} style={{ background:"none", border:"none",
          color:T.muted, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Atla</button>
      </div>

      {/* Content */}
      <div style={{ flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:"0 32px", gap:24 }}>
        <div style={{ width:120, height:120, borderRadius:60,
          background:`${slide.color}18`, border:`2px solid ${slide.color}30`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:60, animation:"fadeUp .4s ease" }}>
          {slide.emoji}
        </div>
        <div style={{ textAlign:"center", animation:"fadeUp .4s ease .1s both" }}>
          <div style={{ fontWeight:900, fontSize:22, color:T.text, marginBottom:10, lineHeight:1.3 }}>
            {slide.title}
          </div>
          <div style={{ fontSize:14, color:T.text2, lineHeight:1.7 }}>
            {slide.sub}
          </div>
        </div>
      </div>

      {/* Dots */}
      <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:20 }}>
        {ONBOARD_SLIDES.map((_,i) => (
          <div key={i} style={{ height:6, borderRadius:3, transition:"all .3s",
            width: i===idx ? 24 : 6,
            background: i===idx ? slide.color : T.dim }}/>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding:"0 24px 40px" }}>
        <button onClick={()=>{ if (last) onDone(); else setIdx(i=>i+1); }}
          style={{ width:"100%", padding:"15px 0", borderRadius:16,
            background: slide.color, border:"none", color:"#fff",
            fontWeight:800, fontSize:16, cursor:"pointer", fontFamily:"inherit",
            transition:"all .2s" }}>
          {last ? "Hemen Başla 🚀" : "İleri →"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 7. AUTH with "Beni Hatırla" + localStorage
// ═══════════════════════════════════════════════════════════════
function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verify, setVerify] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("toptangram_session");
      if (saved) { const s = JSON.parse(saved); onLogin(s.role); }
    } catch {}
  }, []);

  // Check username availability when typing (debounced)
  useEffect(() => {
    if (mode !== "register" || role !== "store" || !username) {
      setUsernameError("");
      return;
    }
    
    const timer = setTimeout(async () => {
      const result = await checkUsernameAvailability(username);
      if (!result.available) {
        setUsernameError("Bu kullanıcı adı zaten alınmış");
      } else {
        setUsernameError("");
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [username, mode, role]);

  const submit = () => {
    if (!email) return;
    if (role === "store" && mode === "register" && !username) {
      setUsernameError("Kullanıcı adı gerekli");
      return;
    }
    if (usernameError) return;
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (mode === "register") { setVerify(true); return; }
      if (remember) {
        try { localStorage.setItem("toptangram_session", JSON.stringify({ role, email })); } catch {}
      }
      onLogin(role);
    }, 900);
  };

  if (verify) return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:28, background:T.bg, gap:20 }}>
      <div style={{ width:72, height:72, borderRadius:36, background:`${T.brand}18`,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>📧</div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontWeight:800, fontSize:20, color:T.text, marginBottom:6 }}>E-posta Doğrula</div>
        <div style={{ fontSize:13, color:T.text2 }}>{email} adresine kod gönderdik</div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        {[0,1,2,3,4,5].map(i => (
          <input key={i} maxLength={1} style={{ width:42, height:50, borderRadius:10, textAlign:"center",
            fontSize:20, fontWeight:700, background:T.raised, border:`1.5px solid ${T.border2}`,
            color:T.text, outline:"none", fontFamily:"inherit" }}/>
        ))}
      </div>
      <Btn full onClick={() => onLogin(role)} sx={{ borderRadius:12, height:48 }}>Hesabı Onayla</Btn>
    </div>
  );

  return (
    <div style={{ height:"100%", overflowY:"auto", background:T.bg, padding:"20px 22px 40px" }}>
      <div style={{ textAlign:"center", margin:"28px 0 30px", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
        <Logo size={60}/>
        <div>
          <div style={{ fontSize:28, fontWeight:900, letterSpacing:"-0.5px", background:T.gradBrand,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontFamily:"'DM Sans',system-ui,sans-serif" }}>
            Toptangram
          </div>
          <div style={{ fontSize:12, color:T.muted, marginTop:3 }}>B2B Toptan Giyim Platformu</div>
        </div>
      </div>
      <div style={{ background:T.surface, borderRadius:14, padding:4, display:"flex", marginBottom:24,
        border:`1px solid ${T.border}` }}>
        {[["customer","👤  Alıcı / Müşteri"],["store","🏪  Mağaza / Satıcı"]].map(([r,l]) => (
          <button key={r} onClick={()=>setRole(r)} style={{ flex:1, padding:"10px 0", borderRadius:10,
            background:role===r?T.brand:"transparent", border:"none",
            color:role===r?"#fff":T.muted, fontSize:13, fontWeight:700, cursor:"pointer",
            transition:"all .2s", fontFamily:"inherit" }}>{l}</button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {mode==="register" && <Field label={role==="store"?"Mağaza Adı":"Ad Soyad"} value={name} onChange={setName} placeholder={role==="store"?"Atlaz Studio":"Ahmet Yılmaz"} icon="person"/>}
        {mode==="register" && role==="store" && (
          <div>
            <Field label="Kullanıcı Adı" value={username} onChange={setUsername} placeholder="atlazstudio" icon="person"/>
            {usernameError && <div style={{ fontSize:12, color:T.rose, marginTop:6 }}>⚠️ {usernameError}</div>}
          </div>
        )}
        <Field label="E-posta" value={email} onChange={setEmail} type="email" placeholder="ornek@email.com" icon="mail"/>
        <Field label="Şifre" value={pass} onChange={setPass} type="password" placeholder="••••••••" icon="lock"/>
        {/* Beni Hatırla */}
        <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
          <div onClick={()=>setRemember(r=>!r)} style={{ width:20, height:20, borderRadius:6,
            background:remember?T.brand:T.raised, border:`1.5px solid ${remember?T.brand:T.border2}`,
            display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
            {remember && <Ic n="check" size={13} color="#fff"/>}
          </div>
          <span style={{ fontSize:13, color:T.text2 }}>Beni Hatırla</span>
        </label>
        <Btn full onClick={submit} sx={{ borderRadius:12, height:50, marginTop:4 }}>
          {loading ? "…" : mode==="login" ? "Giriş Yap" : "Hesap Oluştur"}
        </Btn>
        {mode==="login" && <div style={{ textAlign:"right" }}>
          <button onClick={()=>{
            if (!email) { setPass(""); return; }
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              setVerify(true);
            }, 800);
          }} style={{ background:"none", border:"none", color:T.brand,
            fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Şifremi Unuttum</button>
        </div>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0" }}>
        <div style={{ flex:1, height:1, background:T.border }}/>
        <span style={{ fontSize:12, color:T.muted }}>veya</span>
        <div style={{ flex:1, height:1, background:T.border }}/>
      </div>
      <button onClick={()=>setMode(m=>m==="login"?"register":"login")} style={{ width:"100%",
        padding:"12px 0", borderRadius:12, background:"none", border:`1.5px solid ${T.border2}`,
        color:T.text2, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
        {mode==="login" ? "Hesabın yok mu? Kayıt Ol →" : "Zaten hesabın var mı? Giriş Yap →"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4. PRODUCT CARD — Sepete Ekle + DM butonu, video desteği, yorum YOK
// ═══════════════════════════════════════════════════════════════
function ProductCard({ product:init, onStore, onAddToCart, onSendDM, myStoreId, role, onReport }) {
  const [p, setP] = useState(init);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [idx, setIdx] = useState(0);
  const [heartAnim, setHeartAnim] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [added, setAdded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const lastTap = useRef(0);
  const ht = useRef();
  
  // Check if this product belongs to the current store (user can't add own product to cart)
  const isOwnProduct = role === "store" && myStoreId === p.storeId;

  const doubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300 && !p.liked) {
      setP(x=>({...x, liked:true, likes:x.likes+1}));
      setHeartAnim(true);
      clearTimeout(ht.current);
      ht.current = setTimeout(()=>setHeartAnim(false), 900);
    }
    lastTap.current = now;
  };

  const handleCart = () => {
    onAddToCart(p, selectedVariant);
    setAdded(true);
    setTimeout(()=>setAdded(false), 1500);
  };

  const media = p.media[idx];

  return (
    <div style={{ background:T.card, marginBottom:2, borderBottom:`1px solid ${T.border}` }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px" }}>
        <div style={{ padding:2, borderRadius:"50%", background:T.gradStory, cursor:"pointer" }}
          onClick={()=>onStore&&onStore(p.storeId)}>
          <img src={p.storeAvatar} style={{ width:34, height:34, borderRadius:17,
            border:`2px solid ${T.bg}`, objectFit:"cover", display:"block" }}/>
        </div>
        <div style={{ flex:1, cursor:"pointer" }} onClick={()=>onStore&&onStore(p.storeId)}>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ fontWeight:700, fontSize:13, color:T.text }}>{p.storeUsername}</span>
            {p.storeVerified && <VBadge size={13}/>}
          </div>
          <div style={{ fontSize:11, color:T.muted }}>{p.storeCity} · {p.collection}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={()=>setReportOpen(true)} style={{ background:"none", border:"none",
            cursor:"pointer", padding:"6px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ic n="more" size={18} color={T.muted}/>
          </button>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
            <div style={{ background:`${T.green}18`, border:`1px solid ${T.green}28`,
              borderRadius:8, padding:"4px 10px", fontSize:13, fontWeight:800, color:T.green }}>
              {p.price} ₺
            </div>
            <div style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:6,
              background: p.inStock ? `${T.teal}18` : `${T.rose}18`,
              color: p.inStock ? T.teal : T.rose,
              border: `1px solid ${p.inStock ? T.teal : T.rose}28` }}>
              {p.inStock ? "● Stokta" : "○ Tükendi"}
            </div>
          </div>
        </div>
      </div>
      {/* Variant picker (if product.variants provided) */}
      {p.variants && p.variants.length>0 && (
        <div style={{ padding:"10px 14px", display:"flex", gap:8, flexWrap:"wrap" }}>
          {p.variants.map(v=> (
            <button key={v.id} onClick={()=>setSelectedVariant(v.name)} style={{ padding:"8px 12px", borderRadius:10,
              border:`1.5px solid ${selectedVariant===v.name?T.brand:T.border2}`, background:selectedVariant===v.name?T.brandDim:T.raised,
              color:selectedVariant===v.name?T.brand:T.text, fontWeight:700, cursor:"pointer", fontSize:12 }}>{v.name}</button>
          ))}
          {selectedVariant==="__error__" && (
            <div style={{ width:"100%", padding:"6px 10px", background:T.rose, borderRadius:8,
              color:"#fff", fontSize:11, fontWeight:700 }}>⚠️ Lütfen bir seçenek seçin</div>
          )}
        </div>
      )}

      {/* Media */}
      <div style={{ position:"relative" }} onClick={media.type==="image"?doubleTap:undefined}>
        {media.type==="video"
          ? <VideoPlayer url={media.url} thumb={media.thumb}/>
          : <>
              <img src={media.url} style={{ width:"100%", aspectRatio:"1/1", objectFit:"cover", display:"block" }}/>
              {p.media.length > 1 && (
                <div style={{ position:"absolute", bottom:8, left:0, right:0,
                  display:"flex", justifyContent:"center", gap:4 }}>
                  {p.media.map((_,i) => (
                    <div key={i} onClick={e=>{e.stopPropagation();setIdx(i);}} style={{
                      width:i===idx?7:5, height:i===idx?7:5, borderRadius:"50%",
                      background:i===idx?"#fff":"rgba(255,255,255,.4)", cursor:"pointer" }}/>
                  ))}
                </div>
              )}
            </>
        }
        {heartAnim && (
          <div style={{ position:"absolute", inset:0, display:"flex",
            alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
            <div style={{ animation:"heartPop .9s ease forwards" }}>
              <Ic n="heart" size={80} color="#fff" filled/>
            </div>
          </div>
        )}
      </div>

      {/* Actions — Beğen, Kaydet, Paylaş (yorum YOK) */}
      <div style={{ padding:"8px 14px 4px", display:"flex", alignItems:"center" }}>
        <div style={{ display:"flex", gap:14, flex:1 }}>
          <button onClick={()=>setP(x=>({...x,liked:!x.liked,likes:x.liked?x.likes-1:x.likes+1}))}
            style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
            <Ic n="heart" filled={p.liked} color={p.liked?T.rose:T.text} size={25}/>
          </button>
          <button style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
            <Ic n="share" color={T.text} size={22}/>
          </button>
        </div>
        <button onClick={()=>setP(x=>({...x,saved:!x.saved}))}
          style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
          <Ic n="save" filled={p.saved} color={p.saved?T.brand:T.text} size={24}/>
        </button>
      </div>

      <div style={{ padding:"0 14px 4px" }}>
        <span style={{ fontWeight:700, fontSize:13, color:T.text }}>{p.likes.toLocaleString("tr")} beğeni</span>
      </div>
      <div style={{ padding:"0 14px 8px", fontSize:13, color:T.text2, lineHeight:1.5 }}>
        <span style={{ fontWeight:700, color:T.text }}>{p.name} </span>
        {expanded ? p.description : p.description.slice(0,70)}
        {p.description.length>70 && !expanded && (
          <button onClick={()=>setExpanded(true)} style={{ background:"none", border:"none",
            color:T.muted, cursor:"pointer", padding:0, fontSize:13, fontFamily:"inherit" }}> …daha fazla</button>
        )}
      </div>

      {/* CTA: Sepete Ekle + Teklif Ver + DM */}
      <div style={{ padding:"0 14px 14px", display:"flex", gap:8 }}>
        {!isOwnProduct && (
          <button onClick={handleCart} disabled={!p.inStock} style={{ flex:1, padding:"11px 0", borderRadius:11,
            background: !p.inStock ? T.dim : added ? T.green : T.brand,
            border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:p.inStock?"pointer":"not-allowed",
            fontFamily:"inherit", transition:"background .2s",
            display:"flex", alignItems:"center", justifyContent:"center", gap:7,
            opacity: p.inStock ? 1 : 0.6 }}>
            {!p.inStock ? "Stok Yok" : added ? <>✓ Eklendi</> : <><Ic n="cart" size={16} color="#fff"/> Sepete Ekle</>}
          </button>
        )}
        {isOwnProduct && (
          <div style={{ flex:1, padding:"11px", background:T.dim, borderRadius:11,
            color:T.muted, fontWeight:700, fontSize:13, textAlign:"center", fontFamily:"inherit" }}>
            Kendi ürünü
          </div>
        )}
        {!isOwnProduct && p.inStock && (
          <button onClick={()=>setOfferOpen(true)} style={{ width:44, height:44, borderRadius:11,
            background:T.raised, border:`1.5px solid ${T.border2}`,
            display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
            <span style={{ fontSize:16 }}>💰</span>
          </button>
        )}
        <button onClick={()=>onSendDM&&onSendDM(p)} style={{ width:44, height:44, borderRadius:11,
          background:T.raised, border:`1.5px solid ${T.border2}`,
          display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
          <Ic n="dm" size={19} color={T.brand}/>
        </button>
      </div>
      {offerOpen && <OfferModal product={p} onClose={()=>setOfferOpen(false)} onSendDM={onSendDM}/>}
      
      {/* Report modal */}
      {reportOpen && <ReportModal itemId={p.id} itemType="product" onClose={()=>setReportOpen(false)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STORY VIEWER (fixed) — with left/right navigation
// ═══════════════════════════════════════════════════════════════
function Story({ s, onClose, onNext, onPrev }) {
  const [prog, setProg] = useState(0);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const t = setInterval(() => {
      setProg(p => {
        if (p >= 100) { clearInterval(t); setTimeout(()=>closeRef.current(), 0); return 100; }
        return p + 1.4;
      });
    }, 60);
    return () => clearInterval(t);
  }, []);
  
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) onPrev?.();
    else if (x > rect.width * 2 / 3) onNext?.();
  };
  
  return (
    <div style={{ position:"absolute", inset:0, zIndex:200, background:"#000",
      display:"flex", flexDirection:"column", cursor:"pointer" }} onClick={handleClick}>
      <div style={{ height:2, background:"rgba(255,255,255,.2)", margin:"10px 12px 0" }}>
        <div style={{ height:"100%", background:"#fff", width:`${prog}%`, transition:"width .06s" }}/>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px" }}>
        <Ring src={s.avatar} size={32} seen/>
        <span style={{ color:"#fff", fontWeight:700, fontSize:13 }}>{s.username}</span>
        <button onClick={(e)=>{e.stopPropagation(); onClose();}} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer" }}>
          <Ic n="close" color="#fff" size={20}/>
        </button>
      </div>
      <div style={{ flex:1, overflow:"hidden", position:"relative" }}>
        <img src={s.avatar.replace("w=80","w=600")}
          style={{ width:"100%", height:"100%", objectFit:"cover", filter:"brightness(.8)" }}/>
        {/* Navigation hints */}
        <div style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
          fontSize:24, color:"rgba(255,255,255,.3)" }}>‹</div>
        <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
          fontSize:24, color:"rgba(255,255,255,.3)" }}>›</div>
      </div>
      <div style={{ padding:"12px 14px 24px", display:"flex", gap:10, alignItems:"center" }}>
        <div style={{ flex:1, border:"1px solid rgba(255,255,255,.3)", borderRadius:24,
          padding:"10px 16px", color:"rgba(255,255,255,.4)", fontSize:13 }}>Yanıt…</div>
        <Ic n="share" color="#fff" size={22}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FEED
// ═══════════════════════════════════════════════════════════════
function Feed({ products, onStory, onStore, onAddToCart, onSendDM }) {
  // Sort products by createdAt (newest first)
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // newest first
    });
  }, [products]);
  
  return (
    <div style={{ height:"100%", overflowY:"auto", background:T.bg }}>
      <div style={{ position:"sticky", top:0, zIndex:10, background:T.bg,
        borderBottom:`1px solid ${T.border}`, padding:"10px 16px",
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Logo size={34}/>
          <span style={{ fontSize:20, fontWeight:900, letterSpacing:"-0.5px", background:T.gradBrand,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontFamily:"'DM Sans',system-ui,sans-serif" }}>
            Toptangram
          </span>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button style={{ background:"none", border:"none", cursor:"pointer", width:24, height:24,
            display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
            <Ic n="more" color={T.text} size={22}/>
            <div style={{ position:"absolute", top:-2, right:-2, width:8, height:8,
              borderRadius:"50%", background:T.rose }}/>
          </button>
        </div>
      </div>
      {/* Stories */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, marginBottom:2 }}>
        <div style={{ display:"flex", gap:14, overflowX:"auto", padding:"10px 14px", scrollbarWidth:"none" }}>
          <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:62, height:62, borderRadius:31, background:T.raised,
              border:`2px dashed ${T.border2}`, display:"flex", alignItems:"center",
              justifyContent:"center", cursor:"pointer" }}>
              <Ic n="plus" color={T.brand} size={26}/>
            </div>
            <span style={{ fontSize:10, color:T.muted }}>Ekle</span>
          </div>
          {STORIES.map(s => (
            <div key={s.id} onClick={()=>onStory(s)}
              style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
              <Ring src={s.avatar} size={56} seen={s.seen}/>
              <span style={{ fontSize:10, color:s.seen?T.muted:T.text2, maxWidth:60,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"center" }}>
                {s.username}
              </span>
            </div>
          ))}
        </div>
      </div>
      {sortedProducts.map(p => <ProductCard key={p.id} product={p} onStore={onStore} onAddToCart={onAddToCart} onSendDM={onSendDM} myStoreId="st1" role="customer" onReport={()=>{}}/>)}
      <div style={{ height:70 }}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 5+6. EXPLORE — Sadece mağaza araması + akıllı algoritma
// ═══════════════════════════════════════════════════════════════
function Explore({ onStore, interactedTags }) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [searchMode, setSearchMode] = useState("store"); // store | product
  const [cityFilter, setCityFilter] = useState(null);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const cities = [...new Set(STORES.map(s=>s.city))];

  const storeResults = useMemo(() => {
    if (!q.trim() && !cityFilter) return [];
    return STORES.filter(s => {
      const matchQ = !q.trim() || 
        s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.username.toLowerCase().includes(q.toLowerCase()) ||
        s.city.toLowerCase().includes(q.toLowerCase());
      const matchCity = !cityFilter || s.city === cityFilter;
      return matchQ && matchCity;
    });
  }, [q, cityFilter]);

  const productResults = useMemo(() => {
    if (!q.trim() && !cityFilter && !priceMin && !priceMax) return [];
    return INIT_PRODUCTS.filter(p => {
      const matchQ = !q.trim() ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.tags?.some(t=>t.toLowerCase().includes(q.toLowerCase()));
      const price = parseFloat(p.price)||0;
      const matchMin = !priceMin || price >= parseFloat(priceMin);
      const matchMax = !priceMax || price <= parseFloat(priceMax);
      return matchQ && matchMin && matchMax;
    });
  }, [q, priceMin, priceMax]);

  const smartProducts = useMemo(() => {
    if (!interactedTags.length) return INIT_PRODUCTS;
    const score = (p) => p.tags.filter(t => interactedTags.includes(t)).length;
    return [...INIT_PRODUCTS].sort((a,b) => score(b) - score(a));
  }, [interactedTags]);

  const hasSearch = q.trim() || cityFilter || priceMin || priceMax;
  const results = searchMode === "store" ? storeResults : productResults;

  return (
    <div style={{ height:"100%", overflowY:"auto", background:T.bg }}>
      {/* Search bar */}
      <div style={{ position:"sticky", top:0, background:T.bg, zIndex:10,
        borderBottom:`1px solid ${T.border}` }}>
        <div style={{ padding:"12px 14px 8px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, background:T.raised,
            border:`1.5px solid ${focused?T.brand:T.border2}`, borderRadius:14, padding:"0 14px",
            transition:"border-color .2s" }}>
            <Ic n="search" size={17} color={T.muted}/>
            <input value={q} onChange={e=>setQ(e.target.value)}
              onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
              placeholder={searchMode==="store"?"Mağaza ara (ad, şehir)…":"Ürün ara (ad, etiket)…"}
              style={{ flex:1, background:"none", border:"none", outline:"none",
                padding:"12px 0", color:T.text, fontSize:14, fontFamily:"inherit" }}/>
            {q && <button onClick={()=>setQ("")} style={{ background:"none", border:"none", cursor:"pointer" }}>
              <Ic n="close" size={15} color={T.muted}/>
            </button>}
            <button onClick={()=>setShowFilters(f=>!f)} style={{ background:"none", border:"none", cursor:"pointer",
              width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center",
              borderRadius:8, background: showFilters||cityFilter||priceMin||priceMax ? T.brandDim : "none" }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M7 12h10M10 18h4" stroke={showFilters||cityFilter||priceMin||priceMax?T.brand:T.muted} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{ display:"flex", padding:"0 14px 8px", gap:8 }}>
          {[["store","🏪 Mağaza"],["product","📦 Ürün"]].map(([m,l])=>(
            <button key={m} onClick={()=>setSearchMode(m)} style={{
              padding:"6px 16px", borderRadius:20, border:"none", cursor:"pointer",
              background: searchMode===m ? T.brand : T.raised,
              color: searchMode===m ? "#fff" : T.muted,
              fontSize:12, fontWeight:700, fontFamily:"inherit", transition:"all .15s" }}>{l}</button>
          ))}
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div style={{ padding:"0 14px 12px", display:"flex", flexDirection:"column", gap:10,
            borderTop:`1px solid ${T.border}` }}>
            {/* City filter */}
            <div>
              <div style={{ fontSize:11, color:T.muted, fontWeight:700, marginBottom:6, marginTop:10 }}>ŞEHİR</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <button onClick={()=>setCityFilter(null)} style={{
                  padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer",
                  background:!cityFilter?T.brand:T.raised, color:!cityFilter?"#fff":T.muted,
                  fontSize:11, fontWeight:700, fontFamily:"inherit" }}>Tümü</button>
                {cities.map(c=>(
                  <button key={c} onClick={()=>setCityFilter(x=>x===c?null:c)} style={{
                    padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer",
                    background:cityFilter===c?T.brand:T.raised, color:cityFilter===c?"#fff":T.muted,
                    fontSize:11, fontWeight:700, fontFamily:"inherit" }}>{c}</button>
                ))}
              </div>
            </div>
            {/* Price range (product mode only) */}
            {searchMode === "product" && (
              <div>
                <div style={{ fontSize:11, color:T.muted, fontWeight:700, marginBottom:6 }}>FİYAT ARALIĞI (₺)</div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input value={priceMin} onChange={e=>setPriceMin(e.target.value.replace(/\D/g,""))}
                    placeholder="Min" style={{ flex:1, background:T.raised, border:`1px solid ${T.border2}`,
                      borderRadius:10, padding:"8px 12px", color:T.text, fontSize:13,
                      fontFamily:"inherit", outline:"none" }}/>
                  <span style={{ color:T.muted }}>–</span>
                  <input value={priceMax} onChange={e=>setPriceMax(e.target.value.replace(/\D/g,""))}
                    placeholder="Max" style={{ flex:1, background:T.raised, border:`1px solid ${T.border2}`,
                      borderRadius:10, padding:"8px 12px", color:T.text, fontSize:13,
                      fontFamily:"inherit", outline:"none" }}/>
                  {(priceMin||priceMax) && (
                    <button onClick={()=>{setPriceMin("");setPriceMax("");}} style={{
                      background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:12 }}>✕</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {hasSearch ? (
        <div>
          {/* Result count */}
          <div style={{ padding:"10px 16px", fontSize:12, color:T.muted }}>
            {results.length} sonuç bulundu
          </div>
          {results.length === 0
            ? <div style={{ textAlign:"center", padding:"40px 20px", color:T.muted }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🔍</div>
                <div>"{q}" için {searchMode==="store"?"mağaza":"ürün"} bulunamadı</div>
                {cityFilter && <div style={{ fontSize:12, marginTop:6 }}>Şehir: {cityFilter}</div>}
              </div>
            : searchMode === "store"
              ? storeResults.map(store => (
                <div key={store.id} onClick={()=>onStore(store.id)}
                  style={{ display:"flex", gap:14, padding:"12px 16px",
                    borderBottom:`1px solid ${T.border}`, cursor:"pointer", alignItems:"center" }}>
                  <Ring src={store.avatar} size={46} seen/>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                      <span style={{ fontWeight:700, fontSize:14, color:T.text }}>{store.name}</span>
                      {store.verified && <VBadge size={14}/>}
                      {store.private && <Ic n="lock" size={13} color={T.muted}/>}
                    </div>
                    <div style={{ fontSize:12, color:T.muted }}>@{store.username} · {store.city}</div>
                    <div style={{ fontSize:11, color:T.dim }}>{store.followers.toLocaleString("tr")} takipçi</div>
                  </div>
                  <Btn v="ghost" size="sm" onClick={e=>{e.stopPropagation();onStore(store.id);}}>Gör</Btn>
                </div>
              ))
              : productResults.map(p => (
                <div key={p.id} style={{ display:"flex", gap:12, padding:"12px 16px",
                  borderBottom:`1px solid ${T.border}`, alignItems:"center" }}>
                  <img src={p.media[0].url} style={{ width:60, height:60, borderRadius:10, objectFit:"cover", flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:T.text }}>{p.name}</div>
                    <div style={{ fontSize:12, color:T.text2 }}>{p.storeName} · {p.storeCity}</div>
                    <div style={{ fontSize:12, color:T.green, fontWeight:700, marginTop:3 }}>{p.price}₺/adet</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:11, padding:"4px 10px", borderRadius:8,
                      background: p.inStock?`${T.teal}18`:T.raised,
                      color: p.inStock?T.teal:T.muted }}>
                      {p.inStock?"Stokta":"Tükendi"}
                    </div>
                    <button onClick={()=>onStore(p.storeId)} style={{ marginTop:6, fontSize:11,
                      background:"none", border:"none", color:T.brand, cursor:"pointer", fontFamily:"inherit" }}>
                      Mağazaya Git →
                    </button>
                  </div>
                </div>
              ))
          }
        </div>
      ) : (
        <>
          {interactedTags.length > 0 && (
            <div style={{ padding:"12px 16px 4px" }}>
              <div style={{ fontSize:12, color:T.brand, fontWeight:700, marginBottom:8 }}>
                ✨ Seninle eşleşen ürünler
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                {interactedTags.slice(0,6).map(t => (
                  <span key={t} style={{ fontSize:11, padding:"3px 10px", borderRadius:20,
                    background:T.brandDim, color:T.brand, border:`1px solid ${T.brandBorder}` }}>
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Cities quick filter */}
          <div style={{ padding:"10px 16px 4px" }}>
            <div style={{ fontSize:12, color:T.text2, fontWeight:700, marginBottom:8 }}>Şehre Göre</div>
            <div style={{ display:"flex", gap:8, overflowX:"auto", scrollbarWidth:"none" }}>
              {cities.map(c=>(
                <button key={c} onClick={()=>{ setCityFilter(c); setShowFilters(false); }}
                  style={{ padding:"8px 14px", borderRadius:20, border:"none", cursor:"pointer",
                    background:T.raised, color:T.text2, fontSize:12, fontWeight:600,
                    fontFamily:"inherit", whiteSpace:"nowrap", flexShrink:0 }}>📍 {c}</button>
              ))}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:2, marginTop:8 }}>
            {smartProducts.flatMap(p=>p.media).filter(m=>m.type==="image").slice(0,12).map((m,i)=>(
              <div key={i} style={{ aspectRatio:"1", overflow:"hidden" }}>
                <img src={m.url} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. CART — Mağaza bazlı gruplandırma
// ═══════════════════════════════════════════════════════════════
function CartScreen({ cart, setCart }) {
  const grouped = useMemo(() => {
    const groups = {};
    cart.forEach(item => {
      if (!groups[item.storeId]) groups[item.storeId] = { storeId:item.storeId, storeName:item.storeName, storePhone:item.storePhone, items:[] };
      groups[item.storeId].items.push(item);
    });
    return Object.values(groups);
  }, [cart]);

  const removeItem = (id) => setCart(prev=>prev.filter(i=>i.id!==id));
  const changeQty = (id, d) => setCart(prev=>prev.map(i=>{
    if (i.id!==id) return i;
    const lot = i.minLot || 1;
    const newQty = Math.max(lot, i.qty + d * lot);
    return {...i, qty: newQty};
  }));

  const buildWAText = (group) => {
    const lines = group.items.map(i=>{
      const total = (parseFloat(i.price)||0)*i.qty;
      const variantInfo = i.variant ? ` / ${i.variant}` : "";
      return `• ${i.name}${variantInfo} — ${i.qty} adet (${i.price}₺/adet = ${total}₺)`;
    }).join("\n");
    const grandTotal = group.items.reduce((s,i)=>s+(parseFloat(i.price)||0)*i.qty,0);
    return encodeURIComponent(`Merhaba ${group.storeName}!\n\nAşağıdaki ürünleri sipariş etmek istiyorum:\n\n${lines}\n\nToplam: ${grandTotal.toLocaleString("tr")}₺\n\nLütfen onay verir misiniz?`);
  };

  if (cart.length === 0) return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", background:T.bg, gap:14, padding:24 }}>
      <div style={{ fontSize:48 }}>🛍</div>
      <div style={{ fontWeight:800, fontSize:18, color:T.text }}>Sepetiniz boş</div>
      <div style={{ fontSize:13, color:T.muted, textAlign:"center" }}>
        Feed'deki ürünlerin altındaki "Sepete Ekle" butonunu kullanın
      </div>
    </div>
  );

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", background:T.bg }}>
      <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontWeight:800, fontSize:16, color:T.text }}>Sepetim</span>
        <span style={{ fontSize:12, color:T.muted }}>{cart.length} ürün · {grouped.length} mağaza</span>
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        {grouped.map(group => (
          <div key={group.storeId} style={{ margin:"12px 14px",
            background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
            {/* Store header */}
            <div style={{ padding:"12px 14px", background:T.raised,
              borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
              <img src={STORES.find(s=>s.id===group.storeId)?.avatar}
                style={{ width:32, height:32, borderRadius:16, objectFit:"cover" }}/>
              <span style={{ fontWeight:700, fontSize:14, color:T.text, flex:1 }}>{group.storeName}</span>
              <span style={{ fontSize:11, color:T.muted }}>{group.items.length} ürün</span>
            </div>
            {/* Items */}
            {group.items.map(item => (
              <div key={item.id} style={{ display:"flex", gap:10, padding:"10px 14px",
                borderBottom:`1px solid ${T.border}`, alignItems:"center" }}>
                <img src={item.thumb} style={{ width:58, height:58, borderRadius:10, objectFit:"cover", flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:2 }}>{item.name}</div>
                  <div style={{ fontSize:12, color:T.green, fontWeight:700 }}>{item.price} ₺/adet</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6 }}>
                    <button onClick={()=>changeQty(item.id,-1)} style={{ width:28, height:28, borderRadius:8,
                      background:T.raised, border:`1px solid ${T.border2}`, color:T.text, fontSize:16,
                      cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                    <div style={{ textAlign:"center", minWidth:44 }}>
                      <div style={{ fontWeight:800, color:T.text, fontSize:14 }}>{item.qty}</div>
                      {item.minLot > 1 && <div style={{ fontSize:9, color:T.muted }}>min {item.minLot}</div>}
                    </div>
                    <button onClick={()=>changeQty(item.id,1)} style={{ width:28, height:28, borderRadius:8,
                      background:T.raised, border:`1px solid ${T.border2}`, color:T.text, fontSize:16,
                      cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
                  </div>
                  <div style={{ fontSize:12, color:T.green, fontWeight:700, marginTop:4 }}>
                    Toplam: {(parseFloat(item.price)||0) * item.qty}₺
                  </div>
                </div>
                <button onClick={()=>removeItem(item.id)} style={{ background:"none", border:"none", cursor:"pointer" }}>
                  <Ic n="trash" size={18} color={T.muted}/>
                </button>
              </div>
            ))}
            {/* Grup toplam + WA */}
            <div style={{ padding:"8px 14px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, color:T.muted }}>Ara Toplam</span>
              <span style={{ fontSize:16, fontWeight:800, color:T.green }}>
                {group.items.reduce((s,i)=>s+(parseFloat(i.price)||0)*i.qty, 0).toLocaleString("tr")}₺
              </span>
            </div>
            {/* WA order button per store */}
            <div style={{ padding:"12px 14px" }}>
              <a href={`https://wa.me/${group.storePhone}?text=${buildWAText(group)}`}
                target="_blank" rel="noreferrer"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  padding:"11px 0", background:T.wa, borderRadius:11, color:"#fff",
                  fontWeight:700, fontSize:14, textDecoration:"none", fontFamily:"inherit" }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="#fff"><path d={IP.wa}/></svg>
                Siparişi WhatsApp ile Tamamla
              </a>
            </div>
          </div>
        ))}
        <div style={{ height:20 }}/>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// SİPARİŞ TAKİBİ EKRANI
// ═══════════════════════════════════════════════════════════════
const MOCK_ORDERS = [
  {
    id:"ord1", storeId:"st1", storeName:"Atlaz Studio",
    storeAvatar:"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80",
    date:"3 Mart 2026", total:"3420", status:"delivered",
    items:[
      { name:"Viskon Midi Elbise", variant:"Kırmızı", qty:12, price:"285" },
    ]
  },
  {
    id:"ord2", storeId:"st2", storeName:"Denim Republic",
    storeAvatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80",
    date:"27 Şubat 2026", total:"3480", status:"shipped",
    items:[
      { name:"Oversize Kargo Şort", variant:"Siyah", qty:24, price:"145" },
    ]
  },
  {
    id:"ord3", storeId:"st4", storeName:"Koza Giyim",
    storeAvatar:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80",
    date:"20 Şubat 2026", total:"1140", status:"preparing",
    items:[
      { name:"Polo Yaka Tişört", variant:"Beyaz", qty:12, price:"95" },
    ]
  }
];

const ORDER_STATUS = {
  preparing: { label:"Hazırlanıyor", color:"#f5a623", icon:"⏳", step:1 },
  shipped:   { label:"Kargoda",      color:"#8875f5", icon:"🚚", step:2 },
  delivered: { label:"Teslim Edildi",color:"#52d98b", icon:"✓",  step:3 },
  cancelled: { label:"İptal",        color:"#ef7070", icon:"✕",  step:0 },
};

function OrdersScreen({ onStore }) {
  const [orders] = useState(MOCK_ORDERS);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? orders : orders.filter(o=>o.status===filter);

  if (orders.length === 0) return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:14, padding:24, background:T.bg }}>
      <div style={{ fontSize:48 }}>📦</div>
      <div style={{ fontWeight:800, fontSize:18, color:T.text }}>Henüz sipariş yok</div>
      <div style={{ fontSize:13, color:T.muted, textAlign:"center" }}>
        Mağaza ürünlerini sepete ekleyip WhatsApp ile sipariş verin
      </div>
    </div>
  );

  return (
    <div style={{ height:"100%", overflowY:"auto", background:T.bg }}>
      <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontWeight:800, fontSize:16, color:T.text }}>Siparişlerim</span>
        <span style={{ fontSize:12, color:T.muted }}>{orders.length} sipariş</span>
      </div>

      {/* Status filter */}
      <div style={{ display:"flex", gap:8, padding:"10px 16px", overflowX:"auto", scrollbarWidth:"none" }}>
        {[["all","Tümü"],["preparing","⏳ Hazırlanıyor"],["shipped","🚚 Kargoda"],["delivered","✓ Teslim"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{
            padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer",
            background:filter===v?T.brand:T.raised, color:filter===v?"#fff":T.muted,
            fontSize:12, fontWeight:700, fontFamily:"inherit", whiteSpace:"nowrap", flexShrink:0 }}>{l}</button>
        ))}
      </div>

      {filtered.map(order => {
        const st = ORDER_STATUS[order.status] || ORDER_STATUS.preparing;
        return (
          <div key={order.id} style={{ margin:"10px 14px", background:T.card,
            border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
            {/* Store + date */}
            <div style={{ padding:"12px 14px", display:"flex", gap:10, alignItems:"center",
              borderBottom:`1px solid ${T.border}`, background:T.raised }}>
              <img src={order.storeAvatar} style={{ width:32, height:32, borderRadius:16, objectFit:"cover" }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13, color:T.text }}>{order.storeName}</div>
                <div style={{ fontSize:11, color:T.muted }}>{order.date}</div>
              </div>
              <div style={{ padding:"4px 10px", borderRadius:8,
                background:`${st.color}18`, color:st.color,
                fontSize:11, fontWeight:700, border:`1px solid ${st.color}30` }}>
                {st.icon} {st.label}
              </div>
            </div>

            {/* Sipariş adımları */}
            <div style={{ padding:"12px 14px" }}>
              <div style={{ display:"flex", alignItems:"center", marginBottom:12 }}>
                {["Hazırlanıyor","Kargoda","Teslim"].map((s,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", flex:i<2?1:"none" }}>
                    <div style={{ width:22, height:22, borderRadius:11, display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800,
                      background: st.step>i?T.green:st.step===i+1?T.brand:T.raised,
                      color: st.step>i||st.step===i+1?"#fff":T.muted,
                      border:`2px solid ${st.step>i?T.green:st.step===i+1?T.brand:T.border2}` }}>
                      {st.step>i?"✓":i+1}
                    </div>
                    <div style={{ fontSize:9, color: st.step>i?T.green:st.step===i+1?T.brand:T.muted,
                      marginLeft:4, marginRight:i<2?4:0 }}>{s}</div>
                    {i < 2 && <div style={{ flex:1, height:2, borderRadius:1, marginRight:4,
                      background:st.step>i+1?T.green:T.border }}/>}
                  </div>
                ))}
              </div>
              {/* Items */}
              {order.items.map((item,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"6px 0",
                  borderBottom: i<order.items.length-1?`1px solid ${T.border}`:"none" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{item.name}</div>
                    <div style={{ fontSize:11, color:T.muted }}>{item.variant} · {item.qty} adet</div>
                  </div>
                  <div style={{ fontWeight:700, fontSize:13, color:T.green }}>
                    {(parseFloat(item.price)*item.qty).toLocaleString("tr")}₺
                  </div>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:10,
                paddingTop:10, borderTop:`1px solid ${T.border}` }}>
                <span style={{ fontSize:12, color:T.muted }}>Toplam</span>
                <span style={{ fontSize:16, fontWeight:800, color:T.text }}>{parseFloat(order.total).toLocaleString("tr")}₺</span>
              </div>
            </div>

            {/* Mağazaya git */}
            <div style={{ padding:"0 14px 12px" }}>
              <button onClick={()=>onStore(order.storeId)}
                style={{ width:"100%", padding:"9px 0", borderRadius:10,
                  background:"none", border:`1.5px solid ${T.border2}`,
                  color:T.text2, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                Mağazaya Git →
              </button>
            </div>
          </div>
        );
      })}
      <div style={{ height:70 }}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 8. MESSAGES (Inbox)
// ═══════════════════════════════════════════════════════════════
function Messages({ initialStoreId, onClearInitial }) {
  const [convs, setConvs] = useState(INIT_MESSAGES);
  const [active, setActive] = useState(null);
  const [msgText, setMsgText] = useState("");

  // Open DM when coming from product card
  useEffect(()=>{
    if (!initialStoreId) return;
    const store = STORES.find(s=>s.id===initialStoreId);
    if (!store) return;
    const existing = convs.find(c=>c.storeId===initialStoreId);
    setActive(existing || { id:"dm"+store.id, storeId:store.id, storeName:store.name,
      storeAvatar:store.avatar, last:"", time:"", unread:0, messages:[] });
    if (onClearInitial) onClearInitial();
  }, [initialStoreId]);

  const send = () => {
    if (!msgText.trim() || !active) return;
    const newMsg = { id:"msg"+Date.now(), from:"me", text:msgText, time:"Şimdi" };
    const updated = {...active, messages:[...active.messages, newMsg], last:msgText, time:"Şimdi", unread:0};
    setConvs(prev=>{
      const exists = prev.find(c=>c.id===updated.id);
      return exists ? prev.map(c=>c.id===updated.id?updated:c) : [updated,...prev];
    });
    setActive(updated);
    setMsgText("");
  };

  if (active) return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", background:T.bg }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
        borderBottom:`1px solid ${T.border}`, background:T.surface }}>
        <button onClick={()=>setActive(null)} style={{ background:"none", border:"none",
          cursor:"pointer", color:T.text, fontSize:20, lineHeight:1 }}>←</button>
        <img src={active.storeAvatar} style={{ width:36, height:36, borderRadius:18, objectFit:"cover" }}/>
        <div>
          <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{active.storeName}</div>
          <div style={{ fontSize:10, color:T.teal }}>● Mağaza hesabı</div>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
        {active.messages.length===0 && (
          <div style={{ textAlign:"center", padding:"30px 0", color:T.muted }}>
            <div style={{ fontSize:28, marginBottom:8 }}>💬</div>
            <div style={{ fontSize:13 }}>{active.storeName} ile sohbet başlat</div>
          </div>
        )}
        {active.messages.map(m => (
          <div key={m.id} style={{ display:"flex", justifyContent:m.from==="me"?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"75%", padding:"10px 14px",
              borderRadius:m.from==="me"?"18px 18px 4px 18px":"18px 18px 18px 4px",
              background:m.from==="me"?T.brand:T.raised, color:T.text, fontSize:13, lineHeight:1.5 }}>
              {m.text}
              <div style={{ fontSize:10, color:"rgba(255,255,255,.45)", marginTop:3, textAlign:"right" }}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:"10px 14px 24px", display:"flex", gap:8, borderTop:`1px solid ${T.border}`, alignItems:"center" }}>
        <input value={msgText} onChange={e=>setMsgText(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Mesaj yaz…"
          style={{ flex:1, background:T.raised, border:`1.5px solid ${T.border2}`, borderRadius:22,
            padding:"10px 16px", fontSize:13, outline:"none", color:T.text, fontFamily:"inherit" }}/>
        <button onClick={send} disabled={!msgText.trim()} style={{ background:T.brand, border:"none",
          borderRadius:22, padding:"10px 18px", color:"#fff", fontWeight:700, fontSize:13,
          cursor:msgText.trim()?"pointer":"not-allowed", opacity:msgText.trim()?1:.5, fontFamily:"inherit" }}>
          Gönder
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ height:"100%", overflowY:"auto", background:T.bg }}>
      <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontWeight:800, fontSize:16, color:T.text, flex:1 }}>Mesajlar</span>
        <div style={{ fontSize:11, color:T.muted, background:T.raised, borderRadius:8, padding:"4px 10px" }}>
          🔒 Sadece mağazalar
        </div>
      </div>
      {convs.length===0 && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:T.muted }}>
          <div style={{ fontSize:40, marginBottom:10 }}>💬</div>
          <div>Henüz mesajınız yok</div>
          <div style={{ fontSize:12, marginTop:6 }}>Ürün kartındaki DM butonunu kullanın</div>
        </div>
      )}
      {convs.map(c => (
        <div key={c.id} onClick={()=>{ setActive(c); setConvs(prev=>prev.map(x=>x.id===c.id?{...x,unread:0}:x)); }}
          style={{ display:"flex", gap:12, padding:"12px 16px", borderBottom:`1px solid ${T.border}`,
            cursor:"pointer", alignItems:"center" }}>
          <img src={c.storeAvatar} style={{ width:52, height:52, borderRadius:26, objectFit:"cover" }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14, color:T.text, marginBottom:2 }}>{c.storeName}</div>
            <div style={{ fontSize:12, color:T.muted, overflow:"hidden", textOverflow:"ellipsis",
              whiteSpace:"nowrap", maxWidth:200 }}>{c.last || "Yeni sohbet"}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
            <span style={{ fontSize:11, color:T.muted }}>{c.time}</span>
            {c.unread>0 && (
              <div style={{ minWidth:18, height:18, borderRadius:9, background:T.brand,
                fontSize:10, fontWeight:700, color:"#fff",
                display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }}>
                {c.unread}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STORE PROFILE — İletişime Geç modal + collections
// ═══════════════════════════════════════════════════════════════
function StoreProf({ storeId, onBack, myId, role, onSendDM }) {
  const store = STORES.find(s=>s.id===storeId);
  const [follow, setFollow] = useState("none");
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(store?.bio||"");
  const [col, setCol] = useState(null);
  const [stockTab, setStockTab] = useState("instock"); // instock | archive
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [productImageIdx, setProductImageIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [modalCartAdded, setModalCartAdded] = useState(new Set()); // hangi renkler eklendi
  const isOwn = storeId===myId;
  const [allProducts, setAllProducts] = useState(()=> INIT_PRODUCTS.filter(p=>p.storeId===storeId));
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(()=>{
    let mounted = true;
    setLoadingProducts(true);
    const loadData = async () => {
      try {
        const data = await fetchProducts(storeId);
        if (!mounted) return;
        
        // Sütun isimlerini uygulamanın beklediği formata eşliyoruz
        if (data && data.length) {
          const mapped = data.map(item => ({
            id: item.id,
            title: item.name,
            name: item.name,
            description: item.description || '',
            price: item.price,
            media: [{ type: 'image', url: item.image_url || '' }],
            whatsapp: item.whatsapp_number,
            whatsapp_number: item.whatsapp_number,
            storeId: item.store_id || storeId,
            inStock: item.in_stock !== undefined ? item.in_stock : true,
            collection: item.collection || '',
            tags: item.tags || [],
            likes: item.likes || 0,
            liked: false,
            saved: false,
            timeAgo: '1g',
            storeVerified: store?.verified,
            storeUsername: store?.username,
            storeAvatar: store?.avatar,
            storePhone: item.whatsapp_number || store?.phone,
            storeCity: store?.city,
            storeName: store?.name,
            createdAt: item.created_at
          }));
          setAllProducts(mapped);
        } else {
          setAllProducts([]);
        }
      } catch (err) {
        console.error("Mapping hatası:", err);
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    };
    loadData();
    return ()=>{ mounted = false; };
  }, [storeId]);

  const products = allProducts.filter(p => stockTab==="instock" ? p.inStock : !p.inStock);
  if (!store) return null;

  return (
    <div style={{ height:"100%", overflowY:"auto", background:T.bg, position:"relative" }}>
      <div style={{ display:"flex", alignItems:"center", padding:"12px 14px",
        borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, background:T.bg, zIndex:10 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", marginRight:10 }}>
          <Ic n="close" color={T.text} size={22}/>
        </button>
        <span style={{ fontWeight:800, fontSize:15, color:T.text, flex:1 }}>@{store.username}</span>
        {isOwn && <button onClick={()=>setSettingsOpen(true)} style={{ background:"none", border:"none", cursor:"pointer" }}>
          <Ic n="settings" color={T.muted} size={20}/>
        </button>}
      </div>

      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:14 }}>
          <div style={{ padding:3, borderRadius:"50%", background:T.gradStory }}>
            <img src={store.avatar} style={{ width:80, height:80, borderRadius:"50%",
              border:`3px solid ${T.bg}`, objectFit:"cover" }}/>
          </div>
          {/* Stats — Takip kaldırıldı */}
          <div style={{ display:"flex", gap:18, flex:1, justifyContent:"space-around" }}>
            {[[allProducts.length,"Ürün"],[store.followers.toLocaleString("tr"),"Takipçi"]].map(([v,l]) => (
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontWeight:800, fontSize:20, color:T.text }}>{v}</div>
                <div style={{ fontSize:11, color:T.muted }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
            <span style={{ fontWeight:800, fontSize:15, color:T.text }}>{store.name}</span>
            {store.verified && <VBadge size={16}/>}
            {store.private && <span style={{ fontSize:12, color:T.muted }}>🔒 Gizli</span>}
          </div>
          {editing
            ? <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <Field value={bio} onChange={setBio} placeholder="Biyografi…" multi/>
                <Btn size="sm" onClick={()=>setEditing(false)}>Kaydet</Btn>
              </div>
            : <div style={{ fontSize:13, color:T.text2, lineHeight:1.6 }}>{bio}</div>
          }
          {/* Güven skoru */}
          <div style={{ display:"flex", gap:10, marginTop:10, flexWrap:"wrap" }}>
            {store.verified && (
              <div style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px",
                background:T.gold+"18", border:"1px solid "+T.gold+"30", borderRadius:8 }}>
                <VBadge size={12}/>
                <span style={{ fontSize:11, color:T.gold, fontWeight:700 }}>Doğrulanmış Mağaza</span>
              </div>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px",
              background:T.teal+"18", border:"1px solid "+T.teal+"30", borderRadius:8 }}>
              <span style={{ fontSize:11, color:T.teal, fontWeight:700 }}>⭐ 4.8 · 32 değerlendirme</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px",
              background:T.green+"18", border:"1px solid "+T.green+"30", borderRadius:8 }}>
              <span style={{ fontSize:11, color:T.green, fontWeight:700 }}>🚚 Hızlı Kargo</span>
            </div>
          </div>
        </div>

        {/* Takip + İletişime Geç */}
        {!isOwn && (
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <button onClick={()=>setFollow(f=>f==="accepted"?"none":store.private?"pending":"accepted")}
              style={{ flex:1, padding:"9px 0", borderRadius:11, border:"none", cursor:"pointer",
                fontWeight:700, fontSize:13, fontFamily:"inherit",
                background:follow==="accepted"?T.raised:T.brand, color:follow==="accepted"?T.text:"#fff" }}>
              {follow==="pending"?"⏳ Bekliyor":follow==="accepted"?"✓ Takipte":store.private?"🔒 Takip İste":"Takip Et"}
            </button>
            <button onClick={()=>setContactOpen(true)} style={{
              flex:1, padding:"9px 0", borderRadius:11, border:`1.5px solid ${T.border2}`,
              background:T.raised, color:T.text, fontWeight:700, fontSize:13,
              cursor:"pointer", fontFamily:"inherit" }}>
              İletişime Geç
            </button>
          </div>
        )}

        {/* Collections filter */}
        {store.collections.length > 0 && (
          <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:14, scrollbarWidth:"none" }}>
            <button onClick={()=>setCol(null)} style={{ padding:"6px 14px", borderRadius:20, border:"none",
              cursor:"pointer", background:!col?T.brand:T.raised, color:!col?"#fff":T.muted,
              fontSize:12, fontWeight:600, fontFamily:"inherit", whiteSpace:"nowrap" }}>Tümü</button>
            {store.collections.map(c=>(
              <button key={c} onClick={()=>setCol(x=>x===c?null:c)} style={{ padding:"6px 14px", borderRadius:20,
                border:"none", cursor:"pointer", whiteSpace:"nowrap",
                background:col===c?T.brand:T.raised, color:col===c?"#fff":T.muted,
                fontSize:12, fontWeight:600, fontFamily:"inherit", transition:"all .15s" }}>{c}</button>
            ))}
          </div>
        )}

        {/* Katalog İndir */}
        {isOwn && (
          <div style={{ marginBottom:10, display:"flex", gap:8 }}>
            <button onClick={()=>{
              const lines = allProducts.filter(p=>p.inStock).map(p=>`${p.name} — ${p.price}₺/adet | ${p.description||""}`).join("\n");
              const text = `TOPTANGRAM KATALOG\n${store.name} | @${store.username}\n${new Date().toLocaleDateString("tr-TR")}\n\n${lines}\n\nİletişim: wa.me/${store.phone}`;
              const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href=url; a.download=store.username+"-katalog.txt"; a.click();
              URL.revokeObjectURL(url);
            }} style={{ padding:"8px 14px", borderRadius:11, border:"1.5px solid "+T.border2,
              background:T.raised, color:T.text2, fontWeight:700, fontSize:12,
              cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              📋 Katalog İndir
            </button>
          </div>
        )}
        {/* Stock tabs */}
        <div style={{ display:"flex", borderTop:`1px solid ${T.border}`, marginBottom:2 }}>
          {[["instock",`Stokta (${allProducts.filter(p=>p.inStock).length})`],
            ["archive",`Arşiv (${allProducts.filter(p=>!p.inStock).length})`]].map(([id,label])=>(
            <button key={id} onClick={()=>setStockTab(id)} style={{ flex:1, padding:"10px 0",
              background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
              color:stockTab===id?T.text:T.muted, fontFamily:"inherit",
              borderBottom:`2px solid ${stockTab===id?T.brand:"transparent"}` }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:2 }}>
        {products.filter(p=>!col||p.collection===col).map(p=>(
          <div key={p.id} onClick={()=>setSelectedProduct(p)} style={{ aspectRatio:"4/5", overflow:"hidden", position:"relative",
            opacity: p.inStock ? 1 : 0.55, cursor:"pointer" }}>
            {p.media[0].type==="video"
              ? <div style={{ width:"100%", height:"100%", background:"#000",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <img src={p.media[0].thumb} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  <Ic n="play" size={24} color="#fff" filled sx={{ position:"absolute" }}/>
                </div>
              : <img src={p.media[0].url} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
            }
            <div style={{ position:"absolute", bottom:4, left:4, background:"rgba(0,0,0,.75)",
              borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700,
              color: p.inStock ? T.green : T.rose }}>
              {p.inStock ? `${p.price}₺` : "Tükendi"}
            </div>
          </div>
        ))}
        {products.length===0 && (
          <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"40px 20px", color:T.muted }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📦</div>
            <div>{stockTab==="instock"?"Stokta ürün yok":"Arşivde ürün yok"}</div>
          </div>
        )}
      </div>
      <div style={{ height:60 }}/>

      {/* Product detail modal — tam ekran, tek kolon, çoklu renk sepete */}
      {selectedProduct && (() => {
        const variants = selectedProduct.variants?.map(v=>v.name) || ["Kırmızı","Mavi","Siyah","Beyaz","Yeşil"];
        return (
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.85)",
          display:"flex", alignItems:"flex-end", zIndex:500 }} onClick={()=>{setSelectedProduct(null); setProductImageIdx(0); setSelectedVariant(null); setModalCartAdded(new Set());}}>
          <div onClick={e=>e.stopPropagation()} style={{ width:"100%", background:T.surface,
            borderRadius:"20px 20px 0 0", maxHeight:"92%", display:"flex", flexDirection:"column",
            border:`1px solid ${T.border2}` }}>

            {/* Drag handle + header */}
            <div style={{ padding:"10px 16px 0" }}>
              <div style={{ width:36, height:4, background:T.dim, borderRadius:2, margin:"0 auto 12px" }}/>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <span style={{ fontWeight:800, fontSize:16, color:T.text }}>{selectedProduct.title || selectedProduct.name}</span>
                <button onClick={()=>{setSelectedProduct(null); setProductImageIdx(0); setSelectedVariant(null); setModalCartAdded(new Set());}}
                  style={{ background:T.raised, border:"none", borderRadius:8, padding:"6px 10px", cursor:"pointer", color:T.muted, fontSize:13 }}>✕</button>
              </div>
            </div>

            <div style={{ overflowY:"auto", flex:1 }}>
              {/* Fotoğraf */}
              <div style={{ position:"relative", width:"100%", aspectRatio:"1/1", background:T.bg }}>
                {selectedProduct.media?.[productImageIdx]?.type === "video"
                  ? <video src={selectedProduct.media[productImageIdx].url} muted autoPlay loop playsInline
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <img src={selectedProduct.media?.[productImageIdx]?.url || selectedProduct.media?.[0]?.url}
                      style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                }
                {selectedProduct.media?.length > 1 && (
                  <>
                    <button onClick={()=>setProductImageIdx(i=>i===0?selectedProduct.media.length-1:i-1)}
                      style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
                        background:"rgba(0,0,0,.55)", border:"none", color:"#fff", width:34, height:34,
                        borderRadius:17, cursor:"pointer", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
                    <button onClick={()=>setProductImageIdx(i=>(i+1)%selectedProduct.media.length)}
                      style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                        background:"rgba(0,0,0,.55)", border:"none", color:"#fff", width:34, height:34,
                        borderRadius:17, cursor:"pointer", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
                    <div style={{ position:"absolute", bottom:10, right:10, background:"rgba(0,0,0,.6)",
                      color:"#fff", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>
                      {productImageIdx+1}/{selectedProduct.media.length}
                    </div>
                  </>
                )}
              </div>

              <div style={{ padding:"16px 16px 8px" }}>
                {/* Fiyat + stok */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                    <span style={{ fontSize:28, fontWeight:900, color:T.green }}>₺{selectedProduct.price}</span>
                    <span style={{ fontSize:12, color:T.muted }}>/adet</span>
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:8,
                    background: selectedProduct.inStock ? `${T.teal}18` : `${T.rose}18`,
                    color: selectedProduct.inStock ? T.teal : T.rose,
                    border:`1px solid ${selectedProduct.inStock?T.teal:T.rose}28` }}>
                    {selectedProduct.inStock ? "● Stokta" : "○ Tükendi"}
                  </div>
                </div>

                {/* Açıklama */}
                {selectedProduct.description && (
                  <div style={{ fontSize:13, color:T.text2, lineHeight:1.65, marginBottom:14 }}>
                    {selectedProduct.description}
                  </div>
                )}

                {/* ── Renk / Beden seçimi — çoklu ekleme ── */}
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:T.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:.4 }}>
                    Renk / Seçenek Seç
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {variants.map(v => {
                      const inCart = modalCartAdded.has(v);
                      const selected = selectedVariant === v;
                      return (
                        <button key={v} onClick={()=>setSelectedVariant(s=>s===v?null:v)}
                          style={{ padding:"9px 16px", borderRadius:20, cursor:"pointer", fontFamily:"inherit",
                            fontWeight:700, fontSize:13, transition:"all .15s",
                            border:`2px solid ${selected?T.brand:inCart?T.green:T.border2}`,
                            background: selected?T.brand : inCart?`${T.green}18`:T.raised,
                            color: selected?"#fff" : inCart?T.green : T.text }}>
                          {inCart ? `✓ ${v}` : v}
                        </button>
                      );
                    })}
                  </div>
                  {!selectedVariant && modalCartAdded.size === 0 && (
                    <div style={{ fontSize:11, color:T.muted, marginTop:6 }}>
                      Bir renk seçip "Sepete Ekle"ye bas. Farklı renkler için tekrar seç.
                    </div>
                  )}
                  {modalCartAdded.size > 0 && (
                    <div style={{ fontSize:12, color:T.green, marginTop:6, fontWeight:700 }}>
                      ✓ {modalCartAdded.size} renk sepete eklendi
                    </div>
                  )}
                </div>

                {/* İletişim butonları */}
                <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                  {selectedProduct.storePhone && !isOwn && (
                    <a href={`https://wa.me/${String(selectedProduct.storePhone).replace(/\D/g,'')}?text=${encodeURIComponent("Ürün hakkında bilgi almak istiyorum: "+( selectedProduct.title||selectedProduct.name))}`}
                      target="_blank" rel="noreferrer"
                      style={{ flex:1, padding:"11px 0", background:T.wa, color:"#fff", fontWeight:700, fontSize:13,
                        borderRadius:12, textAlign:"center", textDecoration:"none", display:"flex",
                        alignItems:"center", justifyContent:"center", gap:6 }}>
                      💬 WhatsApp
                    </a>
                  )}
                  <button onClick={()=>{setSelectedProduct(null); onSendDM && onSendDM(selectedProduct);}}
                    style={{ flex:1, padding:"11px 0", background:T.brandDim, border:`1.5px solid ${T.brandBorder}`,
                      color:T.brand, fontWeight:700, fontSize:13, borderRadius:12, cursor:"pointer",
                      fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    💌 Mesaj
                  </button>
                  <button onClick={()=>{
                    navigator.clipboard?.writeText(`${window.location.origin}/#/post/${selectedProduct.id}`).catch(()=>{});
                  }} style={{ width:44, height:44, background:T.raised, border:`1.5px solid ${T.border2}`,
                    borderRadius:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    🔗
                  </button>
                </div>
              </div>
            </div>

            {/* Sepete Ekle — sticky bottom, modal kapanmıyor */}
            <div style={{ padding:"10px 16px 24px", borderTop:`1px solid ${T.border}`, background:T.surface }}>
              <button disabled={!selectedProduct.inStock} onClick={()=>{
                if (!selectedVariant) {
                  // Hiç renk seçilmemişse ilk rengi otomatik seç
                  const firstVariant = variants[0];
                  setSelectedVariant(firstVariant);
                  return;
                }
                // Sepete ekle — modal KAPANMAZ, başka renk seçilebilir
                const cartEvent = new CustomEvent('toptangram:addToCart', {
                  detail: { product: selectedProduct, variant: selectedVariant }
                });
                window.dispatchEvent(cartEvent);
                setModalCartAdded(prev => new Set([...prev, selectedVariant]));
                setSelectedVariant(null); // seçimi sıfırla, kullanıcı başka renk seçsin
              }} style={{ width:"100%", padding:"14px 0", borderRadius:14,
                background: !selectedProduct.inStock ? T.dim : selectedVariant ? T.brand : T.raised,
                border: selectedVariant ? "none" : `1.5px solid ${T.border2}`,
                color: !selectedProduct.inStock ? T.muted : selectedVariant ? "#fff" : T.text2,
                fontWeight:800, fontSize:15, cursor: selectedProduct.inStock ? "pointer" : "not-allowed",
                fontFamily:"inherit", transition:"all .2s",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                opacity: selectedProduct.inStock ? 1 : 0.5 }}>
                {!selectedProduct.inStock ? "Stok Yok"
                  : selectedVariant ? `🛒 "${selectedVariant}" Sepete Ekle`
                  : modalCartAdded.size > 0 ? "✓ Tamamlandı — Kapat"
                  : "Renk Seç"}
              </button>
              {modalCartAdded.size > 0 && (
                <button onClick={()=>{setSelectedProduct(null); setProductImageIdx(0); setSelectedVariant(null); setModalCartAdded(new Set());}}
                  style={{ width:"100%", marginTop:8, padding:"10px 0", borderRadius:12, background:"none",
                    border:"none", color:T.muted, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                  Kapat
                </button>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Settings modal */}
      {settingsOpen && <StoreSettings onBack={()=>setSettingsOpen(false)} storeId={storeId} role={role}/>}

      {contactOpen && <ContactModal store={store} onClose={()=>setContactOpen(false)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 8. MY PROFILE — Beğenilenler + Kaydedilenler + Takip Edilen Mağazalar
// ═══════════════════════════════════════════════════════════════
function MyProfile({ role, onStore, onSendDM }) {
  const [profileTab, setProfileTab] = useState("liked");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const liked = INIT_PRODUCTS.filter(p=>p.liked);
  const saved = INIT_PRODUCTS.filter(p=>p.saved);
  const followedStores = STORES.slice(0,2);

  if (role === "store") return <StoreProf storeId="st1" onBack={()=>{}} myId="st1" role={role} onSendDM={onSendDM}/>;

  return (
    <div style={{ height:"100%", overflowY:"auto", background:T.bg }}>
      {/* Profile header */}
      <div style={{ padding:"20px 16px 0" }}>
        <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:14 }}>
          <div style={{ width:76, height:76, borderRadius:38, background:T.raised,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:34 }}>👤</div>
          <div style={{ display:"flex", gap:14, flex:1, justifyContent:"space-around" }}>
            {[["4","Sipariş"],["2","Takip"],["12","Beğeni"]].map(([v,l])=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontWeight:800, fontSize:18, color:T.text }}>{v}</div>
                <div style={{ fontSize:11, color:T.muted }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontWeight:800, fontSize:15, color:T.text, marginBottom:4, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span>Müşteri Hesabım</span>
          <button onClick={()=>setSettingsOpen(true)} style={{ background:"none", border:"none", cursor:"pointer" }}>
            <Ic n="settings" color={T.muted} size={20}/>
          </button>
        </div>
        <div style={{ fontSize:13, color:T.muted, marginBottom:14 }}>Toptan alım araştırıyorum</div>

        {/* Followed stores */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.text2, marginBottom:8,
            textTransform:"uppercase", letterSpacing:.4 }}>Takip Edilen Mağazalar</div>
          <div style={{ display:"flex", gap:10, overflowX:"auto", scrollbarWidth:"none" }}>
            {followedStores.map(s=>(
              <div key={s.id} onClick={()=>onStore(s.id)}
                style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center",
                  gap:6, cursor:"pointer" }}>
                <Ring src={s.avatar} size={44} seen/>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.text }}>{s.name}</div>
                  <div style={{ fontSize:10, color:T.muted }}>{s.followers.toLocaleString("tr")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs: Siparişler / Beğenilenler / Kaydedilenler */}
      <div style={{ display:"flex", borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}` }}>
        {[["orders","📦 Sipariş"],["liked","❤️ Beğeni"],["saved","🔖 Kayıt"]].map(([id,label])=>(
          <button key={id} onClick={()=>setProfileTab(id)} style={{ flex:1, padding:"11px 0",
            background:"none", border:"none", cursor:"pointer", fontSize:11, fontWeight:700,
            color:profileTab===id?T.text:T.muted, fontFamily:"inherit",
            borderBottom:`2px solid ${profileTab===id?T.brand:"transparent"}` }}>
            {label}
          </button>
        ))}
      </div>

      {profileTab==="orders"
        ? <OrdersScreen onStore={onStore}/>
        : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:2 }}>
              {(profileTab==="liked"?liked:saved).map(p=>(
                <div key={p.id} style={{ aspectRatio:"1", overflow:"hidden", position:"relative" }}>
                  <img src={p.media[0].url||p.media[0].thumb}
                    style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                  <div style={{ position:"absolute", bottom:4, left:4, background:"rgba(0,0,0,.7)",
                    borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700, color:T.green }}>
                    {p.price}₺
                  </div>
                </div>
              ))}
              {(profileTab==="liked"?liked:saved).length===0 && (
                <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"40px 20px", color:T.muted }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>{profileTab==="liked"?"❤️":"🔖"}</div>
                  <div>Henüz {profileTab==="liked"?"beğenilen":"kaydedilen"} ürün yok</div>
                </div>
              )}
            </div>
            <div style={{ height:70 }}/>
          </>
        )
      }

      {/* Customer Settings Modal */}
      {settingsOpen && <CustomerAccount onBack={()=>setSettingsOpen(false)} role={role}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD — Supabase + video desteği
// ═══════════════════════════════════════════════════════════════
function Upload({ store, onNotify, toast }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [col, setCol] = useState("");
  const [inStock, setInStock] = useState(true);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [uploading, setUploading] = useState(false);
  const [prog, setProg] = useState(0);
  const [done, setDone] = useState(false);
  const [minLot, setMinLot] = useState("12");
  const fileRef = useRef();

  const onFile = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    const isVid = f.type.startsWith("video/");
    setMediaType(isVid?"video":"image");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handlePublish = async () => {
    if (!file) { toast.show("Lütfen mankenli bir fotoğraf seçin.", "error"); return; }
    
    setUploading(true); setProg(10);
    try {
      setProg(30);
      const imageUrl = await uploadProductImage(file, store?.id || "my-store-123");
      setProg(65);
      await saveProduct({
        name, price, imageUrl,
        storeId: store?.id || "my-store-123",
        phone: store?.phone || "905000000000"
      });
      setProg(90);
      try {
        onNotify?.({ title: `${store?.name || 'Mağaza'} yeni ürün yayınladı`, body: name, image: imageUrl, meta: { productName: name, storeId: store?.id } });
      } catch (err) { console.error('onNotify error', err); }
      try {
        fetch('https://ncebtxitvbbekbehesxy.functions.supabase.co/triggerNotification', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ store_id: store?.id, title: `${store?.name || 'Mağaza'} yeni ürün paylaştı!`, body: name, url: '/', icon: imageUrl })
        }).catch(e=>console.warn('triggerNotification call failed', e));
      } catch(e) { console.error('trigger call error', e); }
      setProg(100);
      setDone(true);
    } catch (err) {
      toast.show("Yükleme hatası: " + (err?.message || "Lütfen tekrar deneyin"), "error");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setDone(false); setName(""); setPrice(""); setPreview(null); setDesc(""); setCol(""); };

  if (done) return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", gap:18, background:T.bg, padding:28 }}>
      <div style={{ width:80, height:80, borderRadius:40, background:`${T.green}18`,
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Ic n="check" size={40} color={T.green}/>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontWeight:800, fontSize:20, color:T.text }}>Yayınlandı!</div>
        <div style={{ fontSize:13, color:T.text2, marginTop:6 }}>"{name}" Supabase'e yüklendi.</div>
      </div>
      <Btn full onClick={reset}>Yeni Ürün Ekle</Btn>
    </div>
  );

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", background:T.bg }}>
      <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontWeight:800, fontSize:16, color:T.text }}>Ürün / Reels Ekle</span>
        <Btn size="sm" onClick={handlePublish} disabled={!name||!price||!preview||uploading}>
          {uploading?`${prog}%`:"Yayınla"}
        </Btn>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:16 }}>
        <div onClick={()=>!preview&&fileRef.current?.click()}
          style={{ width:"100%", aspectRatio:"4/3", borderRadius:16, overflow:"hidden",
            border:`2px dashed ${preview?"transparent":T.border2}`,
            background:preview?"none":T.raised, cursor:preview?"default":"pointer",
            position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {preview ? (
            <>
              {mediaType==="video"
                ? <video src={preview} muted autoPlay loop playsInline
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : <img src={preview} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              }
              <button onClick={e=>{e.stopPropagation();setPreview(null);}}
                style={{ position:"absolute", top:10, right:10, width:32, height:32, borderRadius:16,
                  background:"rgba(0,0,0,.6)", border:"none", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Ic n="trash" size={16} color="#fff"/>
              </button>
              <div style={{ position:"absolute", bottom:10, left:10, background:"rgba(0,0,0,.6)",
                borderRadius:8, padding:"4px 10px", fontSize:11, fontWeight:700, color:"#fff" }}>
                {mediaType==="video"?"🎬 Video hazır":"✓ Fotoğraf hazır"}
              </div>
            </>
          ) : (
            <div style={{ textAlign:"center", padding:20 }}>
              <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:10 }}>
                <Ic n="photo" size={32} color={T.muted}/>
                <Ic n="video" size={32} color={T.muted}/>
              </div>
              <div style={{ fontWeight:700, fontSize:14, color:T.text2, marginBottom:4 }}>
                Fotoğraf veya Video yükle
              </div>
              <div style={{ fontSize:12, color:T.muted }}>Profesyonel mankenli çekimler</div>
              <div style={{ fontSize:11, color:T.dim, marginTop:4 }}>JPG · PNG · MP4 · MOV · Max 50MB</div>
              <div style={{ marginTop:12, padding:"6px 16px", background:T.brandDim,
                border:`1px solid ${T.brandBorder}`, borderRadius:20, display:"inline-block",
                fontSize:12, color:T.brand, fontWeight:700 }}>Dosya Seç</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={onFile} style={{ display:"none" }}/>
        </div>

        <div style={{ background:`${T.teal}10`, border:`1px solid ${T.teal}22`, borderRadius:12,
          padding:"10px 14px", fontSize:12, color:T.teal, display:"flex", gap:8 }}>
          <span>☁️</span>
          <span>Görsel/Video → <strong>products</strong> bucket · URL → <strong>products</strong> tablosu</span>
        </div>

        <Field label="Ürün Adı *" value={name} onChange={setName} placeholder="Örn: Viskon Midi Elbise" icon="tag"/>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5,
            textTransform:"uppercase", letterSpacing:.5 }}>Birim Fiyat (₺) *</div>
          <div style={{ display:"flex", alignItems:"center", background:T.raised,
            border:`1.5px solid ${T.border2}`, borderRadius:12, padding:"0 14px", gap:8 }}>
            <span style={{ fontSize:20, fontWeight:800, color:T.green }}>₺</span>
            <input value={price} onChange={e=>setPrice(e.target.value.replace(/\D/g,""))} placeholder="285"
              style={{ flex:1, background:"none", border:"none", outline:"none", padding:"12px 0",
                color:T.text, fontSize:20, fontWeight:700, fontFamily:"inherit" }}/>
            <span style={{ fontSize:12, color:T.muted }}>/ adet</span>
          </div>
        </div>
        <Field label="Açıklama" value={desc} onChange={setDesc} multi placeholder="Kumaş, renkler, minimum lot…"/>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:8,
            textTransform:"uppercase", letterSpacing:.5 }}>Minimum Lot (adet)</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {["6","12","24","48"].map(v=>(
              <button key={v} onClick={()=>setMinLot(x=>x===v?"":v)} style={{
                padding:"8px 16px", borderRadius:20, border:"none", cursor:"pointer",
                background:minLot===v?T.brand:T.raised, color:minLot===v?"#fff":T.muted,
                fontSize:12, fontWeight:700, fontFamily:"inherit", transition:"all .15s" }}>{v} adet</button>
            ))}
          </div>
          {minLot && <div style={{ fontSize:11, color:T.teal, marginTop:6 }}>
            ✓ Min. sipariş: {minLot} adet · Toplu alımda %5-15 indirim otomatik uygulanır
          </div>}
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:8,
            textTransform:"uppercase", letterSpacing:.5 }}>Koleksiyon</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {(store?.collections||["İlkbahar 2026","Klasik Seri"]).map(c=>(
              <button key={c} onClick={()=>setCol(x=>x===c?"":c)} style={{ padding:"6px 14px", borderRadius:20,
                border:"none", cursor:"pointer", background:col===c?T.brand:T.raised,
                color:col===c?"#fff":T.muted, fontSize:12, fontWeight:600,
                fontFamily:"inherit", transition:"all .15s" }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Stock toggle */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          background:T.raised, border:`1.5px solid ${T.border2}`, borderRadius:12, padding:"13px 16px" }}>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:T.text }}>Stok Durumu</div>
            <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>
              {inStock ? "Ürün stokta mevcut" : "Ürün stokta yok (Arşiv)"}
            </div>
          </div>
          <div onClick={()=>setInStock(s=>!s)} style={{ cursor:"pointer",
            width:50, height:28, borderRadius:14,
            background: inStock ? T.brand : T.dim, position:"relative", transition:"background .2s" }}>
            <div style={{ position:"absolute", top:3, transition:"left .2s",
              left: inStock ? 25 : 3, width:22, height:22, borderRadius:11, background:"#fff",
              boxShadow:"0 1px 4px rgba(0,0,0,.3)" }}/>
          </div>
        </div>
        {uploading && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:12, color:T.muted }}>
              <span>Supabase'e yükleniyor…</span>
              <span style={{ color:T.brand, fontWeight:700 }}>{prog}%</span>
            </div>
            <div style={{ height:4, background:T.border, borderRadius:2, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${prog}%`, background:T.brand, borderRadius:2, transition:"width .1s" }}/>
            </div>
          </div>
        )}
        <div style={{ height:40 }}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STORE SETTINGS — Firma İnfo, Logo, Güvenlik, İstatistikler
// ═══════════════════════════════════════════════════════════════
function StoreSettings({ onBack, storeId, role }) {
  // Ensure only stores can access this
  if (role !== "store") return null;
  
  const store = STORES.find(s=>s.id===storeId) || STORES[0];
  const [tab, setTab] = useState("info");
  const [firmName, setFirmName] = useState(store.name);
  const [username, setUsername] = useState(store.username || "");
  const [address, setAddress] = useState(store.address || "");
  const [description, setDescription] = useState(store.bio || "");
  const [whatsapp, setWhatsapp] = useState(store.phone || "");
  const [logoPreview, setLogoPreview] = useState(store.avatar);
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [legalType, setLegalType] = useState(null);
  const [storeSettingsMsg, setStoreSettingsMsg] = useState(null);

  const logoRef = useRef();

  const handleLogoUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLogoPreview(URL.createObjectURL(f));
  };

  const handleSaveInfo = () => {
    console.log("Bilgiler kaydedilecek:", firmName);
  };

  const handleChangeEmail = () => {
    if (!newEmail) { setStoreSettingsMsg({ text:"Yeni e-posta girin", type:"error" }); return; }
    setStoreSettingsMsg({ text:"E-posta " + newEmail + " olarak değiştirildi", type:"success" });
    setNewEmail("");
  };

  const handleChangePassword = () => {
    if (!newPass || newPass !== confirmPass) { setStoreSettingsMsg({ text:"Şifreler eşleşmiyor", type:"error" }); return; }
    if (newPass.length < 8) { setStoreSettingsMsg({ text:"Şifre en az 8 karakter olmalı", type:"error" }); return; }
    setStoreSettingsMsg({ text:"Şifre başarıyla değiştirildi", type:"success" });
    setNewPass(""); setConfirmPass("");
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    onBack();
  };

  // Weekly stats mock data
  const weeklyStats = [
    { day: "Pzt", views: 120 },
    { day: "Salı", views: 200 },
    { day: "Çar", views: 150 },
    { day: "Per", views: 300 },
    { day: "Cum", views: 280 },
    { day: "Cmt", views: 350 },
    { day: "Paz", views: 320 }
  ];

  return (
    <div style={{ height:"100%", overflowY:"auto", background:T.bg }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", padding:"12px 16px",
        borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, background:T.bg, zIndex:10 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", marginRight:10 }}>
          <Ic n="close" color={T.text} size={22}/>
        </button>
        <span style={{ fontWeight:800, fontSize:15, color:T.text, flex:1 }}>Mağaza Ayarları</span>
      </div>

      {/* Tab switcher */}
      <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, background:T.surface }}>
        {[["info", "ℹ️ Bilgiler"], ["security", "🔒 Güvenlik"], ["stats", "📊 İstatistik"], ["legal", "📋 Legal"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: "12px 0", background: "none", border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 700, color: tab === id ? T.text : T.muted,
            fontFamily: "inherit", borderBottom: `2px solid ${tab === id ? T.brand : "transparent"}`
          }}>
            {label}
          </button>
        ))}
      </div>
      
      {legalType && <LegalModal type={legalType} onClose={()=>setLegalType(null)}/>}
      {storeSettingsMsg && (
        <div style={{ margin:"0 16px 12px", padding:"10px 14px", borderRadius:10, fontSize:13, fontWeight:700,
          background: storeSettingsMsg.type==="error" ? T.rose : T.green, color:"#fff" }}>
          {storeSettingsMsg.type==="error"?"⚠️ ":"✓ "}{storeSettingsMsg.text}
        </div>
      )}

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* INFO TAB */}
        {tab === "info" && (
          <>
            {/* Logo */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 8, textTransform: "uppercase" }}>
                Mağaza Logosu (1:1 oranında)
              </div>
              <div onClick={() => logoRef.current?.click()} style={{
                width: "100%", height: 150, borderRadius: 12, overflow: "hidden",
                border: `2px dashed ${T.border2}`, background: T.raised, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
              }}>
                <img src={logoPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .2s"
                }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                  <span style={{ color: "#fff", fontSize: 20 }}>📸</span>
                </div>
              </div>
              <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
            </div>

            {/* Firm Name */}
            <Field label="Firma Adı" value={firmName} onChange={setFirmName} placeholder="Ör: Atlaz Textil" icon="person" />

            {/* Username */}
            <Field label="Kullanıcı Adı" value={username} onChange={setUsername} placeholder="atlazstudio" icon="person" />

            {/* WhatsApp */}
            <Field label="WhatsApp Numarası" value={whatsapp} onChange={setWhatsapp} type="tel" placeholder="5050000000" icon="phone" />

            {/* Address */}
            <Field label="Adres" value={address} onChange={setAddress} placeholder="İstanbul, Fatih" icon="location" multi />

            {/* Description */}
            <Field label="Mağaza Açıklaması" value={description} onChange={setDescription}
              placeholder="Mağazanız hakkında bilgi…" multi />

            <Btn full onClick={handleSaveInfo} sx={{ borderRadius: 12, height: 48 }}>Bilgileri Kaydet</Btn>
          </>
        )}

        {/* SECURITY TAB */}
        {tab === "security" && (
          <>
            <div style={{ background: `${T.amber}12`, border: `1px solid ${T.amber}28`, borderRadius: 12, padding: "12px 14px", fontSize: 12, color: T.amber }}>
              ⚠️ Güvenlik ayarlarında değişiklik yapılırken dikkatli olunuz
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>E-posta Değiştir</div>
              <Field label="Yeni E-posta" value={newEmail} onChange={setNewEmail} type="email" placeholder="yeni@email.com" icon="mail" />
              <Btn full onClick={handleChangeEmail} sx={{ borderRadius: 12, height: 44, marginTop: 8 }}>E-postayı Değiştir</Btn>
            </div>

            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Şifre Değiştir</div>
              <Field label="Yeni Şifre" value={newPass} onChange={setNewPass} type="password" placeholder="••••••••" icon="lock" />
              <Field label="Şifre Onayla" value={confirmPass} onChange={setConfirmPass} type="password" placeholder="••••••••" icon="lock" sx={{ marginTop: 8 }} />
              <Btn full onClick={handleChangePassword} sx={{ borderRadius: 12, height: 44, marginTop: 8 }}>Şifre Değiştir</Btn>
            </div>

            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
              <button onClick={() => setShowDeleteConfirm(true)} style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                border: `1.5px solid ${T.rose}`, background: "transparent", color: T.rose,
                fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit"
              }}>
                🗑️ Hesabı Kalıcı Olarak Sil
              </button>
              {showDeleteConfirm && (
                <div style={{
                  position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 16
                }} onClick={() => setShowDeleteConfirm(false)}>
                  <div onClick={(e) => e.stopPropagation()} style={{
                    background: T.surface, borderRadius: 16, padding: 20, maxWidth: 300,
                    border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 14
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>Hesabı Sil?</div>
                    <div style={{ fontSize: 13, color: T.text2 }}>
                      Bu işlem geri alınamaz. Mağaza ve tüm ürünler silinecektir.
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <Btn onClick={() => setShowDeleteConfirm(false)} sx={{ flex: 1, height: 40, borderRadius: 10, background: T.raised, color: T.text }}>
                        İptal
                      </Btn>
                      <button onClick={handleDeleteAccount} style={{
                        flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                        background: T.rose, color: "#fff", fontWeight: 700, fontSize: 13,
                        cursor: "pointer", fontFamily: "inherit"
                      }}>
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* STATS TAB */}
        {tab === "stats" && (
          <>
            {/* KPI kartları */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              {[
                { label:"Takipçi", value:store.followers.toLocaleString("tr"), icon:"👥", color:T.brand },
                { label:"Toplam Ürün", value:allProducts.length, icon:"📦", color:T.teal },
                { label:"Beğeni", value:(allProducts.reduce((s,p)=>s+(p.likes||0),0)).toLocaleString("tr"), icon:"❤️", color:T.rose },
                { label:"Bu Hafta Görüntü", value:"1.920", icon:"👁", color:T.amber },
              ].map(kpi=>(
                <div key={kpi.label} style={{ background:T.raised, borderRadius:14, padding:"14px 14px",
                  border:"1px solid "+T.border2 }}>
                  <div style={{ fontSize:22, marginBottom:6 }}>{kpi.icon}</div>
                  <div style={{ fontSize:20, fontWeight:900, color:kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Haftalık bar chart */}
            <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:10 }}>Haftalık Görüntülenme</div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:100,
              background:T.raised, borderRadius:12, padding:"12px 12px 8px" }}>
              {weeklyStats.map((stat, idx) => {
                const maxViews = Math.max(...weeklyStats.map(s => s.views));
                const heightPercent = maxViews ? (stat.views / maxViews) * 100 : 0;
                return (
                  <div key={idx} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                    <div style={{ width:"100%", flex:1, display:"flex", alignItems:"flex-end" }}>
                      <div style={{ width:"100%", height:heightPercent+"%", minHeight:4,
                        background:idx===weeklyStats.length-1?T.brand:T.brandDim,
                        borderRadius:"3px 3px 0 0", transition:"height .3s" }}/>
                    </div>
                    <span style={{ fontSize:9, fontWeight:700, color:T.muted }}>{stat.day}</span>
                    <span style={{ fontSize:9, color:T.brand }}>{stat.views}</span>
                  </div>
                );
              })}
            </div>

            {/* En çok ilgi gören ürünler */}
            <div style={{ fontWeight:800, fontSize:14, color:T.text, marginTop:16, marginBottom:10 }}>En Çok Beğenilen Ürünler</div>
            {[...allProducts].sort((a,b)=>(b.likes||0)-(a.likes||0)).slice(0,3).map((p,i)=>(
              <div key={p.id} style={{ display:"flex", gap:10, alignItems:"center", padding:"8px 0",
                borderBottom:"1px solid "+T.border }}>
                <div style={{ width:20, fontWeight:800, fontSize:13, color:T.muted }}>#{i+1}</div>
                <img src={p.media[0]?.url} style={{ width:40, height:40, borderRadius:8, objectFit:"cover" }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{p.name}</div>
                  <div style={{ fontSize:11, color:T.muted }}>{(p.likes||0).toLocaleString("tr")} beğeni · {p.price}₺</div>
                </div>
                <div style={{ width:6, height:6, borderRadius:3,
                  background:p.inStock?T.green:T.rose }}/>
              </div>
            ))}
          </>
        )}

        {/* LEGAL TAB */}
        {tab === "legal" && (
          <>
            <div style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 12, padding: "12px 14px", fontSize: 12, color: T.muted }}>
              Toptangram'ın hukuki metinlerini burdan okuyabilirsiniz.
            </div>
            <button onClick={()=>setLegalType("eula")} style={{
              width: "100%", padding: "14px 16px", borderRadius: 12,
              border: `1.5px solid ${T.border2}`, background: T.raised, color: T.text,
              fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <span>📋 Kullanım Şartları (EULA)</span>
              <span style={{ fontSize: 16 }}>›</span>
            </button>
            <button onClick={()=>setLegalType("privacy")} style={{
              width: "100%", padding: "14px 16px", borderRadius: 12,
              border: `1.5px solid ${T.border2}`, background: T.raised, color: T.text,
              fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <span>🔒 Gizlilik Politikası</span>
              <span style={{ fontSize: 16 }}>›</span>
            </button>
          </>
        )}
      </div>

      <div style={{ height: 70 }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CUSTOMER ACCOUNT — Profil, Adres, E-posta, Güvenlik + Legal
// ═══════════════════════════════════════════════════════════════
function CustomerAccount({ onBack, role }) {
  // Ensure only customers can access this
  if (role !== "customer") return null;

  const [tab, setTab] = useState("profile");
  const [fullName, setFullName] = useState("Ahmet Yılmaz");
  const [address, setAddress] = useState("İstanbul, Fatih");
  const [email, setEmail] = useState("ahmet@example.com");
  const [phone, setPhone] = useState("5050000000");
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [legalType, setLegalType] = useState(null);

  const [customerMsg, setCustomerMsg] = useState(null);

  const showMsg = (text, type="success") => {
    setCustomerMsg({ text, type });
    setTimeout(() => setCustomerMsg(null), 3000);
  };

  const handleSaveProfile = () => {
    showMsg("Profil bilgileri kaydedildi");
  };

  const handleChangeEmail = () => {
    if (!newEmail) { showMsg("Yeni e-posta girin", "error"); return; }
    showMsg("E-posta " + newEmail + " olarak değiştirildi");
    setEmail(newEmail); setNewEmail("");
  };

  const handleChangePassword = () => {
    if (!newPass || newPass !== confirmPass) { showMsg("Şifreler eşleşmiyor", "error"); return; }
    if (newPass.length < 8) { showMsg("Şifre en az 8 karakter olmalı", "error"); return; }
    showMsg("Şifre başarıyla değiştirildi");
    setNewPass(""); setConfirmPass("");
  };

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false);
    try {
      // Gerçek implementasyonda Supabase Auth admin API kullanılır
      // const { error } = await supabase.auth.admin.deleteUser(userId);
      localStorage.removeItem("toptangram_session");
      showMsg("Hesap silindi. Yönlendiriliyorsunuz…");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      showMsg("Hesap silme hatası: " + (err?.message || "Lütfen daha sonra tekrar deneyin"), "error");
    }
  };

  if (legalType) return <LegalModal type={legalType} onClose={()=>setLegalType(null)}/>;

  return (
    <div style={{ height: "100%", overflowY: "auto", background: T.bg }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", padding: "12px 16px",
        borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, background: T.bg, zIndex: 10
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", marginRight: 10 }}>
          <Ic n="close" color={T.text} size={22} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 15, color: T.text, flex: 1 }}>Profil Ayarlarım</span>
      </div>

      {customerMsg && (
        <div style={{ margin:"0 16px 10px", padding:"10px 14px", borderRadius:10, fontSize:13, fontWeight:700,
          background: customerMsg.type==="error" ? T.rose : T.green, color:"#fff" }}>
          {customerMsg.type==="error"?"⚠️ ":"✓ "}{customerMsg.text}
        </div>
      )}
      {/* Tab switcher */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
        {[["profile", "👤 Profil"], ["security", "🔒 Güvenlik"], ["legal", "📋 Legal"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: "12px 0", background: "none", border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 700, color: tab === id ? T.text : T.muted,
            fontFamily: "inherit", borderBottom: `2px solid ${tab === id ? T.brand : "transparent"}`
          }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* PROFILE TAB - Customer Personal Information Only */}
        {tab === "profile" && (
          <>
            <Field label="Ad-Soyad" value={fullName} onChange={setFullName} placeholder="Ahmet Yılmaz" icon="person" />
            <Field label="E-posta" value={email} onChange={setEmail} type="email" placeholder="ahmet@example.com" icon="mail" disabled />
            <Field label="Telefon" value={phone} onChange={setPhone} type="tel" placeholder="5050000000" icon="phone" />
            <Field label="Teslimat Adresi" value={address} onChange={setAddress} placeholder="İstanbul, Fatih" icon="location" multi />
            <Btn full onClick={handleSaveProfile} sx={{ borderRadius: 12, height: 48 }}>Bilgileri Kaydet</Btn>
          </>
        )}

        {/* SECURITY TAB */}
        {tab === "security" && (
          <>
            <div style={{ background: `${T.amber}12`, border: `1px solid ${T.amber}28`, borderRadius: 12, padding: "12px 14px", fontSize: 12, color: T.amber }}>
              ⚠️ Hesap güvenliğiniz için önemli işlemleri sadece şifreli yapınız
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>E-posta Değiştir</div>
              <div style={{
                background: T.raised, border: `1.5px solid ${T.border2}`, borderRadius: 12,
                padding: "12px 14px", fontSize: 12, color: T.muted, marginBottom: 8
              }}>
                Mevcut: {email}
              </div>
              <Field label="Yeni E-posta" value={newEmail} onChange={setNewEmail} type="email" placeholder="yeni@email.com" icon="mail" />
              <Btn full onClick={handleChangeEmail} sx={{ borderRadius: 12, height: 44, marginTop: 8 }}>E-postayı Değiştir</Btn>
            </div>

            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Şifre Değiştir</div>
              <Field label="Yeni Şifre" value={newPass} onChange={setNewPass} type="password" placeholder="••••••••" icon="lock" />
              <Field label="Şifre Onayla" value={confirmPass} onChange={setConfirmPass} type="password" placeholder="••••••••" icon="lock" sx={{ marginTop: 8 }} />
              <Btn full onClick={handleChangePassword} sx={{ borderRadius: 12, height: 44, marginTop: 8 }}>Şifre Değiştir</Btn>
            </div>

            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
              <button onClick={() => setShowDeleteConfirm(true)} style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                border: `1.5px solid ${T.rose}`, background: "transparent", color: T.rose,
                fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit"
              }}>
                🗑️ Hesabı Kalıcı Olarak Sil
              </button>
              {showDeleteConfirm && (
                <div style={{
                  position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 16
                }} onClick={() => setShowDeleteConfirm(false)}>
                  <div onClick={(e) => e.stopPropagation()} style={{
                    background: T.surface, borderRadius: 16, padding: 20, maxWidth: 320,
                    border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 14
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>Hesabı Sil?</div>
                    <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.6 }}>
                      Bu işlem geri alınamaz. Sipariş geçmişi, beğeniler ve tüm verileri silinecektir. Supabase veritabanından kalıcı olarak kaldırılacaksınız.
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <Btn onClick={() => setShowDeleteConfirm(false)} sx={{ flex: 1, height: 40, borderRadius: 10, background: T.raised, color: T.text }}>
                        İptal
                      </Btn>
                      <button onClick={handleDeleteAccount} style={{
                        flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                        background: T.rose, color: "#fff", fontWeight: 700, fontSize: 13,
                        cursor: "pointer", fontFamily: "inherit"
                      }}>
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* LEGAL TAB */}
        {tab === "legal" && (
          <>
            <div style={{ background: T.raised, border: `1px solid ${T.border2}`, borderRadius: 12, padding: "12px 14px", fontSize: 12, color: T.muted }}>
              Toptangram'ın hukuki metinlerini burdan okuyabilirsiniz.
            </div>
            <button onClick={()=>setLegalType("eula")} style={{
              width: "100%", padding: "14px 16px", borderRadius: 12,
              border: `1.5px solid ${T.border2}`, background: T.raised, color: T.text,
              fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <span>📋 Kullanım Şartları (EULA)</span>
              <span style={{ fontSize: 16 }}>›</span>
            </button>
            <button onClick={()=>setLegalType("privacy")} style={{
              width: "100%", padding: "14px 16px", borderRadius: 12,
              border: `1.5px solid ${T.border2}`, background: T.raised, color: T.text,
              fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <span>🔒 Gizlilik Politikası</span>
              <span style={{ fontSize: 16 }}>›</span>
            </button>
          </>
        )}
      </div>

      <div style={{ height: 70 }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB BAR — cart + messages tabs added
// ═══════════════════════════════════════════════════════════════
function TabBar({ active, set, role, cartCount, msgCount }) {
  const tabs = role==="store"
    ? [{id:"feed",n:"home"},{id:"explore",n:"search"},{id:"upload",n:"plus"},{id:"messages",n:"msg"},{id:"profile",n:"person"}]
    : [{id:"feed",n:"home"},{id:"explore",n:"search"},{id:"cart",n:"cart"},{id:"messages",n:"msg"},{id:"profile",n:"person"}];

  return (
    <div style={{ position:"absolute", bottom:0, left:0, right:0, background:T.surface,
      borderTop:`1px solid ${T.border}`, display:"flex", padding:"8px 0 20px", zIndex:50 }}>
      {tabs.map(tab=>{
        const on = active===tab.id;
        const isAdd = tab.id==="upload";
        const badge = tab.id==="cart"?cartCount:tab.id==="messages"?msgCount:0;
        return (
          <button key={tab.id} onClick={()=>set(tab.id)} style={{ flex:1, background:"none",
            border:"none", cursor:"pointer", display:"flex", alignItems:"center",
            justifyContent:"center", padding:"4px 0", position:"relative" }}>
            <div style={{ padding:isAdd?"9px":"0", borderRadius:isAdd?13:0,
              background:isAdd?T.brand:"transparent" }}>
              <Ic n={tab.n} size={isAdd?22:24} color={isAdd?"#fff":on?T.brand:T.muted} filled={on&&!isAdd}/>
            </div>
            {badge>0 && (
              <div style={{ position:"absolute", top:0, right:"20%", minWidth:16, height:16, borderRadius:8,
                background:T.rose, fontSize:9, fontWeight:700, color:"#fff",
                display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px" }}>
                {badge}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REPORT/COMPLAINT MODAL (Moderasyon & Apple/Google Policy)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// FİYAT TEKLİFİ MODAL
// ═══════════════════════════════════════════════════════════════
function OfferModal({ product, onClose }) {
  const [qty, setQty] = useState("24");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const unitPrice = parseFloat(product.price)||0;
  const offerQty = parseInt(qty)||1;
  const total = unitPrice * offerQty;
  const discount = offerQty >= 96 ? 15 : offerQty >= 48 ? 10 : offerQty >= 24 ? 5 : 0;
  const discountedTotal = Math.round(total * (1 - discount/100));

  const handleSend = () => {
    const msg = `Merhaba! "${product.name}" ürününüzden ${offerQty} adet almak istiyorum.${discount>0?" %"+discount+" lot indirimi bekliyorum.":""} Toplam: ${discountedTotal.toLocaleString("tr")}₺ olur mu?${note ? "\n\nNot: "+note : ""}`;
    const phone = String(product.storePhone||"").replace(/[^0-9]/g,"");
    const waUrl = "https://wa.me/"+phone+"?text="+encodeURIComponent(msg);
    window.open(waUrl, "_blank");
    setSent(true);
    setTimeout(onClose, 1500);
  };

  if (sent) return (
    <div style={{ position:"absolute", inset:0, zIndex:600, background:"rgba(0,0,0,.8)",
      display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:T.surface, borderRadius:20, padding:32, textAlign:"center", border:"1px solid "+T.border }}>
        <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
        <div style={{ fontWeight:800, fontSize:16, color:T.text }}>Teklif Gönderildi!</div>
        <div style={{ fontSize:12, color:T.muted, marginTop:6 }}>WhatsApp açılıyor…</div>
      </div>
    </div>
  );

  return (
    <div style={{ position:"absolute", inset:0, zIndex:600, background:"rgba(0,0,0,.8)",
      display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", background:T.surface, borderRadius:"20px 20px 0 0", border:"1px solid "+T.border2 }}>
        <div style={{ padding:"10px 16px 0" }}>
          <div style={{ width:36, height:4, background:T.dim, borderRadius:2, margin:"0 auto 14px" }}/>
          <div style={{ fontWeight:800, fontSize:15, color:T.text, marginBottom:4 }}>💰 Fiyat Teklifi Ver</div>
          <div style={{ fontSize:12, color:T.muted, marginBottom:16 }}>{product.name} · {product.storeName}</div>
        </div>
        <div style={{ padding:"0 16px 32px", display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:800, color:T.muted, marginBottom:8, textTransform:"uppercase" }}>Kaç Adet?</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["12","24","48","96"].map(v=>(
                <button key={v} onClick={()=>setQty(v)} style={{
                  padding:"8px 16px", borderRadius:20, border:"2px solid "+(qty===v?T.brand:T.border2),
                  background:qty===v?T.brand:T.raised, color:qty===v?"#fff":T.text2,
                  fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>{v} adet</button>
              ))}
              <input value={qty} onChange={e=>setQty(e.target.value.replace(/[^0-9]/g,""))} placeholder="Diğer"
                style={{ width:80, padding:"8px 12px", borderRadius:20, border:"2px solid "+T.border2,
                  background:T.raised, color:T.text, fontWeight:700, fontSize:13, fontFamily:"inherit", outline:"none", textAlign:"center" }}/>
            </div>
          </div>
          <div style={{ background:T.raised, borderRadius:14, padding:"14px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:13, color:T.text2 }}>{offerQty} × {unitPrice}₺</span>
              <span style={{ fontWeight:700, color:T.text }}>{total.toLocaleString("tr")}₺</span>
            </div>
            {discount > 0 && (
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, color:T.teal }}>🎁 Lot İndirimi ({discount}%)</span>
                <span style={{ color:T.teal, fontWeight:700 }}>−{(total-discountedTotal).toLocaleString("tr")}₺</span>
              </div>
            )}
            <div style={{ height:1, background:T.border, margin:"8px 0" }}/>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:14, fontWeight:800, color:T.text }}>Toplam Teklif</span>
              <span style={{ fontSize:18, fontWeight:900, color:T.green }}>{discountedTotal.toLocaleString("tr")}₺</span>
            </div>
          </div>
          <Field label="Ek Not" value={note} onChange={setNote} multi placeholder="Kumaş, renk, teslimat…"/>
          <button onClick={handleSend} style={{ padding:"14px 0", borderRadius:14, background:T.wa, border:"none",
            color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            💬 WhatsApp ile Teklif Gönder
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportModal({ itemId, itemType, onClose }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [reportErr, setReportErr] = useState("");
  const handleReport = async () => {
    if (!reason) { setReportErr("Lütfen bir neden seçin"); return; }
    setReportErr("");
    setSubmitted(true);
    try {
      // insert into Supabase 'reports' table
      await supabase.from('reports').insert([{ 
        item_id: itemId,
        item_type: itemType,
        reason,
        details,
        reported_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.error('Report submit error', err);
    }
    setTimeout(()=>{ onClose(); }, 1500);
  };

  if (submitted) return (
    <div style={{ position:"absolute", inset:0, zIndex:300, background:"rgba(0,0,0,.7)",
      display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", background:T.surface,
        borderRadius:"20px 20px 0 0", padding:"40px 16px", border:`1px solid ${T.border2}` }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✓</div>
          <div style={{ fontWeight:800, fontSize:16, color:T.text, marginBottom:6 }}>Şikayet Alındı</div>
          <div style={{ fontSize:13, color:T.muted }}>İçeriği inceleyeceğiz. Bilinveri için teşekkür ederiz.</div>
        </div>
      </div>
    </div>
  );

  const reasons = [
    "Uygunsuz içerik",
    "Sahte ürün",
    "Yanıltıcı bilgi",
    "Spam/İstenmeyen",
    "IP İhlali",
    "Diğer"
  ];

  return (
    <div style={{ position:"absolute", inset:0, zIndex:300, background:"rgba(0,0,0,.7)",
      display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", background:T.surface,
        borderRadius:"20px 20px 0 0", padding:"20px 16px 36px", border:`1px solid ${T.border2}` }}>
        <div style={{ width:36, height:4, background:T.dim, borderRadius:2, margin:"0 auto 20px" }}/>
        <div style={{ fontWeight:800, fontSize:15, color:T.text, marginBottom:16 }}>Şikayet Et / Bildir</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
          {reasons.map(r => (
            <button key={r} onClick={()=>setReason(r)} style={{
              padding:"12px 14px", borderRadius:10, border:`1.5px solid ${reason===r?T.brand:T.border2}`,
              background:reason===r?T.brandDim:T.raised, color:reason===r?T.brand:T.text,
              fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", textAlign:"left"
            }}>{r}</button>
          ))}
        </div>
        <Field label="Ek Detay" value={details} onChange={setDetails} multi placeholder="Sorun hakkında başka bilgi…"/>
        {reportErr && (
          <div style={{ padding:"8px 12px", background:T.rose, borderRadius:8, color:"#fff",
            fontSize:12, fontWeight:700, marginBottom:8 }}>⚠️ {reportErr}</div>
        )}
        <Btn full onClick={handleReport} sx={{ marginTop:14, height:44, borderRadius:12 }}>
          Şikayeti Gönder
        </Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BLOCK USER MODAL
// ═══════════════════════════════════════════════════════════════
function BlockUserModal({ userId, userName, onClose, onBlock }) {
  const [blocked, setBlocked] = useState(false);

  const handleBlock = () => {
    setBlocked(true);
    setTimeout(()=>{ onBlock?.(); onClose(); }, 1200);
  };

  if (blocked) return (
    <div style={{ position:"absolute", inset:0, zIndex:300, background:"rgba(0,0,0,.7)",
      display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.surface, borderRadius:16,
        padding:24, maxWidth:280, border:`1px solid ${T.border}`, textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🚫</div>
        <div style={{ fontWeight:800, fontSize:16, color:T.text, marginBottom:4 }}>Engellendi</div>
        <div style={{ fontSize:12, color:T.muted }}>{userName} artık sizin profilinizi göremez</div>
      </div>
    </div>
  );

  return (
    <div style={{ position:"absolute", inset:0, zIndex:300, background:"rgba(0,0,0,.7)",
      display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.surface, borderRadius:16,
        padding:24, maxWidth:280, border:`1px solid ${T.border}`, display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:16, color:T.text, marginBottom:4 }}>"{userName}" kullanıcısını engelle?</div>
          <div style={{ fontSize:12, color:T.muted }}>Engellenen kullanıcılar sizin profilinizi göremez ve sizle mesajlaşamaz.</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={onClose} v="outline" sx={{ flex:1, height:40, borderRadius:10 }}>İptal</Btn>
          <button onClick={handleBlock} style={{
            flex:1, padding:"10px 0", borderRadius:10, border:"none",
            background:T.rose, color:"#fff", fontWeight:700, fontSize:13,
            cursor:"pointer", fontFamily:"inherit"
          }}>Engelle</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS MODAL
// ═══════════════════════════════════════════════════════════════
function NotificationsModal({ items, onClose }) {
  return (
    <div style={{ position:"absolute", inset:0, zIndex:400, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxHeight:"70vh", background:T.surface, borderRadius:"20px 20px 0 0", padding:16, border:`1px solid ${T.border2}` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ fontWeight:800, fontSize:15, color:T.text }}>Bildirimler</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}><Ic n="close" color={T.text} size={18}/></button>
        </div>
        <div style={{ overflowY:"auto", maxHeight:420 }}>
          {items.length===0 && <div style={{ textAlign:"center", color:T.muted, padding:30 }}>Hiç bildirim yok</div>}
          {items.map((n,i)=> (
            <div key={i} style={{ padding:"12px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ width:44, height:44, borderRadius:10, background:T.raised, flexShrink:0 }}>
                <img src={n.image||"https://via.placeholder.com/44"} style={{ width:44, height:44, objectFit:"cover", borderRadius:8 }}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:13, color:T.text }}>{n.title}</div>
                <div style={{ fontSize:12, color:T.muted }}>{n.body}</div>
              </div>
              <div style={{ fontSize:11, color:T.muted }}>{n.timeAgo||"Şimdi"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LEGAL MODALS (EULA & Privacy Policy)
// ═══════════════════════════════════════════════════════════════
function LegalModal({ type, onClose }) {
  const isEULA = type === "eula";
  const title = isEULA ? "Kullanım Şartları (EULA)" : "Gizlilik Politikası";
  
  const content = isEULA ? `
TOPTANGRAM KULLANICI SÖZLEŞMESİ

Son Güncelleme: Mart 2026

1. HİZMET AÇIKLAMASI
Toptangram, toptan giyim ürünleri pazarlaması için kullanılan bir mobil platformdur.

2. YASAL SORUMLULUK
• Kullanıcılar paylaştığı içerikten sorumludur
• Platform, uygunsuz içerikleri kaldırma hakkını saklı tutar
• Yasadışı faaliyetler raporlanır

3. ÜRÜN VERİLERİ
• Satıcılar doğru fiyat ve stok bilgisi sağlamalı
• Müşteriler toptan siparişleri kabul ederler

4. DİPLERİN DÜZENI
• Topseller karşılaştırılan tüm şikayetlere cevap vermesi gerekir
• Hileli etkinlikler yasaklanmıştır

5. HİZMET SONLANDIRMASI
Platform, hüküm ihlali durumunda hesapları sonlandırabilir.
  ` : `
TOPTANGRAM GİZLİLİK POLİTİKASI

Son Güncelleme: Mart 2026

1. TOPLANAN VERİLER
• Ad, e-posta, telefon, adres (kullanıcı tarafından sağlanan)
• Tarama geçmişi, beğeniler, kaydedilenler
• Cihaz bilgisi (IP, browser)

2. VERİ KULLANIMI
• Hizmet sunmak için gerekli veriler kullanılır
• Pazarlama amaçlı kullanım isteğe bağlıdır
• Üçüncü taraflarla paylaştırılmaz

3. ÇEREZLER
Platform, deneyimi geliştirmek için çerezler kullanır.

4. KULLANICI HAKLARI
• Verilerinize erişim talebinde bulunabilir
• Verilerinizin silinmesini isteyebilir
• Pazarlama e-postalarını iptal edebilir

5. GÜVENLIK
Veriler TLS şifreleme ile korunur.

6. İLETİŞİM
privacy@toptangram.com
  `;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400, background:"rgba(0,0,0,.7)",
      display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", background:T.bg, height:"85vh",
        borderRadius:"20px 20px 0 0", display:"flex", flexDirection:"column",
        border:`1px solid ${T.border2}` }}>
        <div style={{ display:"flex", alignItems:"center", padding:"14px 16px",
          borderBottom:`1px solid ${T.border}`, justifyContent:"space-between" }}>
          <span style={{ fontWeight:800, fontSize:15, color:T.text, flex:1 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}>
            <Ic n="close" color={T.text} size={22}/>
          </button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:16, fontSize:12, color:T.text2, lineHeight:1.8 }}>
          {content.split('\n').map((line, i) => (
            <div key={i} style={{ marginBottom: line.trim().startsWith('•') ? 8 : 4 }}>
              {line}
            </div>
          ))}
        </div>
        <div style={{ padding:"14px 16px", borderTop:`1px solid ${T.border}` }}>
          <Btn full onClick={onClose} sx={{ height:44, borderRadius:12 }}>Anladım</Btn>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SPLASH SCREEN (Loading)
// ═══════════════════════════════════════════════════════════════
function SplashScreen() {
  return (
    <div style={{ height:"100%", background:T.bg, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:24 }}>
      <Logo size={80}/>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:24, fontWeight:900, letterSpacing:"-1px", background:T.gradBrand,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontFamily:"Georgia,serif",
          marginBottom:6 }}>Toptangram</div>
        <div style={{ fontSize:12, color:T.muted }}>Yükleniyor…</div>
      </div>
      <div style={{ width:40, height:3, borderRadius:2, background:T.border, overflow:"hidden" }}>
        <div style={{ height:"100%", width:"60%", background:T.brand, borderRadius:2,
          animation:"pulse 1.5s ease-in-out infinite", animationName:"pulse" }}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const toast = useToast();
  const [onboarded, setOnboarded] = useState(() => {
    try { return !!localStorage.getItem("toptangram_onboarded"); } catch { return false; }
  });
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState("customer");
  const [tab, setTab] = useState("feed");
  const [story, setStory] = useState(null);
  const [storyIdx, setStoryIdx] = useState(0);
  const [storeId, setStoreId] = useState(null);
  const [cart, setCart] = useState([]);
  const [interactedTags, setInteractedTags] = useState([]);
  const [dmStoreId, setDmStoreId] = useState(null); // DM target from product card
  const [viewingPostId, setViewingPostId] = useState(null); // For viewing specific product post
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Handle URL-based product post viewing
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/post/')) {
      const postId = hash.substring(7);
      const product = INIT_PRODUCTS.find(p => p.id === postId);
      if (product) {
        setViewingPostId(product);
        setStoreId(product.storeId);
      }
    }
  }, []);
  
  // Simulate network error handling
  useEffect(() => {
    const handleOnline = () => setErrorMsg(null);
    const handleOffline = () => setErrorMsg("Bağlantı Hatası: Lütfen internetinizi kontrol edin");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  
  // Story navigation
  const handleNextStory = () => {
    const nextIdx = storyIdx + 1;
    if (nextIdx < STORIES.length) {
      setStoryIdx(nextIdx);
      setStory(STORIES[nextIdx]);
    } else {
      setStory(null);
    }
  };

  const handleNewNotification = async (n) => {
    const item = { ...n, created_at: new Date().toISOString() };
    setNotifications(prev => [item, ...prev]);
    // try persist to Supabase (if table exists)
    try {
      await supabase.from('notifications').insert([{ title: n.title, body: n.body, image: n.image || null, meta: n.meta || null, created_at: item.created_at }]);
    } catch (err) {
      console.error('Notification insert error', err);
    }
    // show system notification if permitted
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(n.title, { body: n.body, icon: n.image });
      }
    } catch (err) { console.error('system notification error', err); }
  };

  // Register service worker and subscribe to push (called when user opts in)
  const registerAndSubscribe = async (userId=null, storeId=null) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Tarayıcınız push bildirimlerini desteklemiyor'); return null;
      return null;
    }
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered', reg);
      // request permission
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return null;
      // Fetch VAPID public key from Supabase Edge Function
      let vapidPublicKey = null;
      try {
        const resp = await fetch('https://ncebtxitvbbekbehesxy.functions.supabase.co/vapid');
        const j = await resp.json(); vapidPublicKey = j.publicKey;
      } catch (e) {
        console.warn('Could not fetch VAPID key from Supabase Functions', e);
      }
      const subscribeOptions = vapidPublicKey ? { userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) } : { userVisibleOnly: true };
      const subscription = await reg.pushManager.subscribe(subscribeOptions);
      // send subscription securely to Supabase Edge Function
      await fetch('https://ncebtxitvbbekbehesxy.functions.supabase.co/subscribe', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ subscription, user_id: userId, store_id: storeId })
      });
      return subscription;
    } catch (err) { console.error('register/subscribe error', err); return null; }
  };

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  const handlePrevStory = () => {
    const prevIdx = storyIdx - 1;
    if (prevIdx >= 0) {
      setStoryIdx(prevIdx);
      setStory(STORIES[prevIdx]);
    } else {
      setStory(null);
    }
  };

  const handleOpenStory = (s) => {
    const idx = STORIES.findIndex(story => story.id === s.id);
    setStoryIdx(idx);
    setStory(s);
  };

  const addToCart = useCallback((product, variant=null) => {
    setCart(prev => {
      const key = `${product.id}::${variant||""}`;
      // If exists, increment qty
      const exists = prev.find(i=>i.key===key);
      if (exists) return prev.map(i=>i.key===key?{...i, qty:i.qty+1}:i);
      // Otherwise add new line
      return [...prev, {
        id:"ci"+Date.now(), key, productId:product.id, variant:variant||null,
        storeId:product.storeId, storeName:product.storeName, storePhone:product.storePhone,
        name:product.name, price:product.price,
        thumb:(product.media && product.media[0])?(product.media[0].url||product.media[0].thumb):"",
        qty:1
      }];
    });
    setInteractedTags(prev => [...new Set([...prev, ...(product.tags||[] )])]);
  }, []);

  // DM butonu — sadece müşteri mağazayla mesajlaşabilir
  const handleSendDM = useCallback((product) => {
    if (role === "store") return; // mağazalar birbirine DM atamaz (B2B kısıt)
    setDmStoreId(product.storeId);
    setTab("messages");
    setStoreId(null);
  }, [role]);

  const changeTab = useCallback((t) => { setTab(t); setStoreId(null); }, []);
  const msgCount = INIT_MESSAGES.reduce((s,m)=>s+m.unread, 0);

  // Listen for addToCart events dispatched from product detail modal
  useEffect(() => {
    const handler = (e) => {
      const { product, variant } = e.detail;
      addToCart(product, variant);
      toast.show(`"${product.name}" sepete eklendi!`, "success");
    };
    window.addEventListener('toptangram:addToCart', handler);
    return () => window.removeEventListener('toptangram:addToCart', handler);
  }, [addToCart]);

  return (
    <div style={{ fontFamily:"'DM Sans','Helvetica Neue',system-ui,sans-serif", background:"#0a0a0f",
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px 0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{display:none}
        input,textarea,button,a{font-family:'DM Sans',system-ui,sans-serif}
        @keyframes heartPop{0%{transform:scale(0);opacity:1}50%{transform:scale(1.15);opacity:1}100%{transform:scale(1);opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{ width:390, height:812, background:T.bg, borderRadius:54,
        boxShadow:"0 0 0 10px #181820,0 0 0 12px #222230,0 56px 120px rgba(0,0,0,.8)",
        overflow:"hidden", position:"relative", display:"flex", flexDirection:"column",
        animation:"fadeUp .35s ease" }}>

        {/* Status bar */}
        <div style={{ background:T.bg, padding:"12px 28px 4px",
          display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <span style={{ fontSize:13, fontWeight:700, color:T.text }}>9:41</span>
          <div style={{ width:110, height:28, background:"#000", borderRadius:14,
            position:"absolute", left:"50%", transform:"translateX(-50%)", top:6 }}/>
          <div style={{ display:"flex", gap:5, alignItems:"center" }}>
            <span style={{ fontSize:10, color:T.muted }}>5G</span>
            <div style={{ display:"flex", gap:1, alignItems:"flex-end" }}>
              {[4,6,8,10].map(h=><div key={h} style={{ width:3, height:h, background:T.text, borderRadius:1 }}/>)}
            </div>
            <div style={{ width:22, height:11, border:`1.5px solid ${T.muted}`, borderRadius:3,
              display:"flex", alignItems:"center", padding:"0 1.5px" }}>
              <div style={{ flex:1, height:7, background:T.green, borderRadius:2 }}/>
            </div>
          </div>
        </div>

        {/* Notification bell — sadece giriş sonrası göster */}
        {authed && <div style={{ position:"absolute", top:48, right:18, zIndex:60 }}>
          <button onClick={async ()=>{
            if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
              try { await Notification.requestPermission(); } catch(e){}
            }
            // if granted and not already subscribed, register and subscribe
            if (Notification.permission === 'granted') {
              try { await registerAndSubscribe(/* userId */ null, /* storeId */ null); } catch(e){}
            }
            setShowNotifications(s=>!s);
          }} style={{ width:40, height:40, borderRadius:12, border:"none", background:T.surface, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <Ic n="bell" size={18} color={notifications.length?T.brand:T.muted} />
            {notifications.length>0 && (
              <div style={{ position:"absolute", top:6, right:6, minWidth:14, height:14, borderRadius:8, background:T.rose, color:"#fff", fontSize:10, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }}>{notifications.length}</div>
            )}
          </button>
        </div>}

        <div style={{ flex:1, overflow:"hidden", position:"relative" }}>
          {!onboarded
            ? <Onboarding onDone={()=>{ try{localStorage.setItem("toptangram_onboarded","1");}catch{} setOnboarded(true); }}/>
            : !authed
              ? <Auth onLogin={(r)=>{ setRole(r); setAuthed(true); }}/>
              : storeId
              ? <StoreProf storeId={storeId} onBack={()=>setStoreId(null)} myId="st1" role={role} onSendDM={handleSendDM}/>
              : <>
                  {tab==="feed"     && <Feed products={INIT_PRODUCTS} onStory={handleOpenStory} onStore={setStoreId} onAddToCart={addToCart} onSendDM={handleSendDM}/>}
                  {tab==="explore"  && <Explore onStore={setStoreId} interactedTags={interactedTags}/>}
                  {tab==="cart"     && <CartScreen cart={cart} setCart={setCart}/>}
                  {tab==="messages" && <Messages initialStoreId={dmStoreId} onClearInitial={()=>setDmStoreId(null)}/>}
                  {tab==="upload"   && role==="store" && <Upload store={STORES[0]} onNotify={handleNewNotification} toast={toast}/>}
                  {tab==="profile"  && <MyProfile role={role} onStore={setStoreId} onSendDM={handleSendDM}/>}
                  {story && <Story s={story} onClose={()=>setStory(null)} onNext={handleNextStory} onPrev={handlePrevStory}/>}
                  {showNotifications && <NotificationsModal items={notifications} onClose={()=>setShowNotifications(false)}/>}
                  <toast.ToastContainer/>
                  
                  {/* Error / Offline banner */}
                  {errorMsg && (
                    <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:200,
                      background:"#1a0a0a", borderBottom:"2px solid "+T.rose, padding:"10px 16px",
                      display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:8, height:8, borderRadius:4, background:T.rose }}/>
                        <span style={{ fontSize:12, fontWeight:700, color:T.rose }}>Bağlantı Kesildi</span>
                        <span style={{ fontSize:11, color:T.muted }}>İnternet bağlantınızı kontrol edin</span>
                      </div>
                      <div style={{ fontSize:11, color:T.muted }}>Önbellek görüntüleniyor</div>
                    </div>
                  )}
                </>
          }
        </div>

        {authed && !story && !storeId && (
          <TabBar active={tab} set={changeTab} role={role}
            cartCount={cart.length} msgCount={msgCount}/>
        )}
      </div>


    </div>
  );
}
