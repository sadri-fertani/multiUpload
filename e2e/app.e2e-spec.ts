import { MultiUploadAppPage } from './app.po';

describe('multi-upload-app App', () => {
  let page: MultiUploadAppPage;

  beforeEach(() => {
    page = new MultiUploadAppPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
