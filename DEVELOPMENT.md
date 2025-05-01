This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

## Getting Started

First, run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the popup by modifying `popup.tsx`. It should auto-update as you make changes. To add an options page, simply add a `options.tsx` file to the root of the project, with a react component default exported. Likewise to add a content page, add a `content.ts` file to the root of the project, importing some module and do some logic, then reload the extension on your browser.

## Styling with Tailwind CSS

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling. The configuration is set up in `tailwind.config.js` and `postcss.config.js`. 

To use Tailwind CSS in your components:

1. Import the global CSS file at the top of your component:
   ```tsx
   import "./style.css"; // or "../style.css" for nested components
   ```

2. Use Tailwind utility classes in your JSX:
   ```tsx
   <div className="flex flex-col p-4">
     <h1 className="text-2xl font-bold mb-4">Hello World</h1>
   </div>
   ```

For further guidance on Tailwind CSS, [visit the Tailwind Documentation](https://tailwindcss.com/docs).

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Submit to the webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Prior to using this action however, make sure to build your extension and upload the first version to the store to establish the basic credentials. Then, simply follow [this setup instruction](https://docs.plasmo.com/framework/workflows/submit) and you should be on your way for automated submission!
