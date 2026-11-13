(() => {
const button=document.getElementById('adultActivitiesButton');
const page=document.getElementById('adultActivitiesView');
const back=document.getElementById('adultActivitiesBackButton');
const dashboard=document.getElementById('dashboardView');
const frame=document.getElementById('adultActivitiesFrame');
if(!button||!page||!back||!dashboard||!frame)return;
button.addEventListener('click',()=>{
 if(dashboard.classList.contains('hidden'))return;
 if(!frame.src && frame.dataset.src)frame.src=frame.dataset.src;
 dashboard.classList.add('hidden');
 page.classList.remove('hidden');
 window.scrollTo(0,0);
});
back.addEventListener('click',()=>{page.classList.add('hidden');dashboard.classList.remove('hidden');window.scrollTo(0,0)});
const obs=new MutationObserver(()=>{if(dashboard.classList.contains('hidden') && !page.classList.contains('hidden'))return;if(document.getElementById('loginView')?.classList.contains('hidden')===false)page.classList.add('hidden')});
obs.observe(document.getElementById('loginView'),{attributes:true,attributeFilter:['class']});
})();