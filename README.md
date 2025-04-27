# 503Nproj

**This repo is ~80 MB so please be patient while cloning and read me in the meantime**

**In this video, we show you our resource group** (we used AKS):

https://drive.google.com/file/d/1E12ZxxRLItucd6IXWoz0I7z5nH-JboqD/view?usp=sharing  


**Our Resource Group on Azure (we gave you reader access on your AUB email):**   
https://portal.azure.com/#@mail.aub.edu/resource/subscriptions/7f09d7a4-8b8e-4c9e-91ad-d1820abf1358/resourceGroups/LearnifyAI/overview   
 

**It is fully dockerized. To run it, ensure you have a .env file in the root of the project.** The env variables are available here, shared with your gmail. It will be downloaded as "env" so please rename to ".env": https://drive.google.com/file/d/1dxXaqdh8gZBsrLWBsfx9BhjFGhhkfjZz/view?usp=sharing  

Then run:   
```
docker-compose up --build
```

The frontend should be accessible on http://localhost:3000.  
   
**Monitoring** is configured on Azure for the hosted app. We hosted a prometheus instance on AKS and it scrapes the other pods.  
The file used to configure prometheus is `k8s/prometheus-cm0-configmap.yaml`

### Features
1. Document upload: you may upload documents up to 10MB. Documents can only be pdf. Longer documents need more time to be processed. Documents that cannot be parsed are processed as images in batches using the GPT IEP to generate summarized notes from them. Otherwise, the raw text is extracted. Then the text is embedded using the API call in embeddings_iep (text-embedding-3-large) and stored in Chroma.

2. Quiz generation: generates quizzes from documents using the GPT IEP, using gpt-4o to return a multiple choice quiz in json format.

3. Course suggestions: suggests courses for a topic you're interested in based on your academic level, done in the course_creator IEP, uses gpt for searching the web for relevant courses from the selected platforms (e.g. Khan Academy, Coursera).

4. Audio lessons: generate an audio lesson from a document. Given the document's text, the audio_gen iep uses gpt-4o-mini-tts to generate an audio lesson.

Note that only the external endpoint can call the internal endpoints. The architecture looks like this: 
https://drive.google.com/file/d/1J-hXmmsdD5mJASEqyDfPwiZXGp4tqEv_/view?usp=sharing   


### Project Structure:
`EEP/`: The external endpoint, containing routes, the database model, and database connection clients.  
`.github/workflows/`: Workflows for CD  
`audio_gen_iep/, course_creator/, embeddings_iep/, gpt_iep/`: The internal endpoints. Each contains a flask app, Dockerfile, requirements, and unit tests.  
`learning-platform`: contains the Next.JS frontend app.  
`k8s/`: contains the Kubernetes yaml files: Service and deployment files for each container, prometheus configurations, ingress, and cluster-issuer for managing digital certificates.
`tests`: contains tests for functions in the EEP.
`docker-compose.yml` in the project root   



### Run the tests
1. Test Embeddings IEP
```
pytest -q embeddings_iep/tests/test_app.py
```
2. Test gpt_iep
```
pytest -q gpt_iep/tests/test_app.py
```
3. Test audio_gen_iep
```
pytest -q audio_gen_iep/tests/test_app.py
```
4. Test the course_creator  
```
pytest -q course_creator/tests/test_app.py
```
