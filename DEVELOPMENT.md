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

## New version release
The publishing to stores is automated with githbu CI and is triggered by pushing tags with format of "v###". 
First update package.json version, then push a new tag for the corresponding version.
```
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## Firefox validation timeout
If it times out it means something is wrong with the artifact. Try to upload a new release using their website, and it should tell you the validation errors it is seeing.
