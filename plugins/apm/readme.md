### Format with Prettier
```
npx prettier "./plugins/apm/**/*.js" --write
```

### Run tests
```
node scripts/jest.js apm --watch
```

### Lint code
```
npx eslint ./plugins/apm
```

### Ensure everything from master has been backported to 6.x
```
git fetch origin && git checkout 6.x && git diff origin/6.x..origin/master ./plugins/apm | git apply
```
