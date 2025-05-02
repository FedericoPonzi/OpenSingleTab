This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).
This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

## Development server
```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build.
There is hot reloading so you only need to install the development extension once.

For dev, use chrome and load as dev extension the content of `build/chrome-mv3-dev`. The code should work for firefox as well.


## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores - 
you will need the key.json file, which is included in GitHub secrets for automated submissions.