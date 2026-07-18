import { expect, test, type Page } from '@playwright/test';

const admin = { id:'1',email:'admin@recruit.example.com',display_name:'Адміністратор',role:'admin',role_name:'Адміністратор',permissions:['candidates.read','candidates.create','candidates.export','analytics.read'],must_change_password:false,candidate_id:null };

async function mockApi(page: Page, authenticated = false) {
  let signedIn = authenticated;
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if(path.endsWith('/auth/me')) return route.fulfill(signedIn ? {json:admin} : {status:401,json:{detail:'Потрібна авторизація'}});
    if(path.endsWith('/auth/refresh')) return route.fulfill({status:401,json:{detail:'Сесію завершено'}});
    if(path.endsWith('/auth/login')) { signedIn=true; return route.fulfill({json:admin}); }
    if(path.endsWith('/analytics/dashboard')) return route.fulfill({json:{total:5,new_week:2,upcoming_interviews:1,by_stage:[{name:'Реєстрація',count:3},{name:'Прийнято',count:2}]}});
    if(path.endsWith('/search')) return route.fulfill({json:[]});
    return route.fulfill({json:{items:[],total:0,page:1,page_size:20}});
  });
}

test('staff can sign in and sees live dashboard', async ({page}) => {
  await mockApi(page);
  await page.goto('/login');
  await page.getByRole('button',{name:'Увійти'}).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText('Усього кандидатів')).toBeVisible();
  await expect(page.getByText('5',{exact:true})).toBeVisible();
});

test('permission guard and not-found states are rendered', async ({page}) => {
  await mockApi(page,true);
  await page.goto('/users');
  await expect(page.getByText('Доступ заборонено')).toBeVisible();
  await page.goto('/missing-page');
  await expect(page.getByText('Сторінку не знайдено')).toBeVisible();
});
