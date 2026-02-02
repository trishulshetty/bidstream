//step 1 
git init (creates a local repo of our project )
git status (checks all the untracked file in the repo)
git config --global user.name "trishulshetty"
git config --global user.email "trishulshettygs@gmail.com"
git config --global --list


Push code to GitHub (first time)
git branch -M main
git remote add origin https://github.com/trishulshetty/<repo-name>.git
git push -u origin main

Renames the current branch to main, connects your local project to the GitHub repository, and pushes your code to GitHub while setting main as the default upstream branch.