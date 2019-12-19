# hackathon-2020
Code repository for the first Beale group Hackathon

## Coding style guidelines:

### 1. Script structure:

Please try to stick to this rough script outline to make it as easy as possible for other users to see how the script works:

	Introductory section - brief comment about what the script is used for
	Load libraries
	Load functions
	Read in data
	The different sections of your analysis
	Generate outputs of your analysis
	Save processed data / outputs of analysis

Please try to use relative filepaths where possible in scripts - particularly  when loading data and functions


### 2. Naming files and objects:

Script file names should be meaningful and end in `.R`

Variable names should be all lowercase letters, with words separated by dots (e.g. `variable.name`)

Function names should have the first word with all lowercase letters, with subsequent words capitalised and no delimiter between words  (e.g. `functionName`)

External files (e.g. '.csv', '.txt') should be all lowercase letters, with words separated by underscores (e.g. `variable_name.csv`)


### 3. Spacing:

Place spaces around all operators (=, +, -, <-, etc.) (e.g. my.data <- read.csv("my_data.csv") **NOT** my.data<-read.csv("my_data.csv"))

Add spaces after commas (e.g. x[1, ]) 

Extra spacing is fine if it improves alignment of assignments (`<-`)

Always indent the code inside curly braces


