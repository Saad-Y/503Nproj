# 503Nproj

**Our Resource Group on Azure (we gave you reader access on your AUB email):**   
https://portal.azure.com/#@mail.aub.edu/resource/subscriptions/7f09d7a4-8b8e-4c9e-91ad-d1820abf1358/resourceGroups/LearnifyAI/overview   

**The Hosted App:**   
https://learnify503n.space   

**It is fully dockerized. To run it, ensure you have a .env file in the root of the project.** We'll send the env file in the submission email. Please add an OpenAI api key, then run:   
```
docker-compose up --build
```

The frontend should be accessible on http://localhost:3000.   
**Monitoring** is configured on Azure for the hosted app. We hosted a prometheus instance on AKS and it scrapes the other pods. You can view the dashboard on https://grafana-20250420112710-gxecgfanf6dwdjds.nuae.grafana.azure.com/d/eejnq0mwroflsf/learnify-dashboard?orgId=1   
The file used to configure prometheus is `k8s/prometheus-cm0-configmap.yaml`

### Features
1. Document upload: you may upload documents up to 10MB. Nonparsable documents can be png, jpeg, jpg, or pdf. Parsable documents can be docx, pdf, or txt files. Longer documents need more time to be processed.

2. Quiz generation: generates quizzes from documents

3. Course suggestions: suggests courses for a topic you're interested in based on your academic level

4. Audio lessons: generate an audio lesson from a document.


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
