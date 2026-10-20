async (page) => { for (const name of ['المقلّد','العقرب','العقربة','العرّافة','الحرامي','القلّاب','بنت الليل']) { await page.getByRole('button', {name, exact:true}).click(); } }
