import json
from openai import OpenAI
import asyncio
def extract_text_from_response(response):
    """
    Extracts the text from the OpenAI RESPONSE API response.
    """
    try:
        r = json.dumps(response.output, default=lambda o: o.__dict__ , indent=2)
        # Parse the JSON string back into a Python dictionary
        json_data = json.loads(r)
        print ('data recieved = ' , json_data)
        for item in json_data:
            if 'content' in item:
                for content_item in item['content']:
                    if 'text' in content_item:
                        text_content = content_item['text']
                        break

        parts = text_content.split('```')
        if len(parts) >= 3: 
            code_block = parts[1].strip() 
        else:
            raise ValueError("No code block found in the response.")
        if code_block.lower().startswith('json'): 
            code_block = code_block[len('json'):].lstrip() 
            result = json.loads(code_block)
            return result
        else:
            raise ValueError("No JSON code block found in the response.")
        
    except json.JSONDecodeError as e:   
        raise ValueError(f"Failed to decode JSON: {e}")

    except KeyError as e:
        raise ValueError(f"Invalid response format: {e}")   


def parse_urls(response_parsed):
  urls = []
  print('urls recieved = ',response_parsed)
  for r in response_parsed:
      urls.append(response_parsed[r]['url'])
  return urls


def send_to_api(prompt , api_key):
    
    client = OpenAI(api_key=api_key)

    # Send the prompt to the ChatGPT API
    response = client.responses.create(
        model="gpt-4o",  
        input = prompt,
        tools=[
            {
                "type": "web_search"
            }]
    )
    return extract_text_from_response(response)
    

def get_modules(api_key, url):

    prompt = (
        f"what are the modules for this course {url} ? please state for each module what are the covered topics and what will the student understand from these topics."
        "Please double check of the url returned, you are returning broken ones"
        "Don't guess the URLs, actually fetch the page and extract them directly from the HTML or navigation list"
        "Dont tell me to check the link myself or to enter the link to get the information, all the information i am requesting is in the html or navigation list. extract it from there"
        "please return them in this format in json: ["
        "{"
                "unit_name : " 
                "unit_url :"
                "unit_summary : "
                "learning_objectives : ["
                "Understand vector representation and operations ,"
                "Apply dot and cross products, "
                "Visualize vectors in 2D and 3D space ]"
        "}"
            )
    response = send_to_api(prompt, api_key)
    print('modules recieved = ',response)
    return response


def get_urls(api_key , student_status , course , platforms):
    """
    student_status: a string that describes the student status, like computer science student
    course : common name for course example calculus 3
    platforms : a list of platforms to search in, like udemy, coursera, edx
    """
    def parse_platforms(platform_list):
        return ', '.join(platform_list)
    platforms = parse_platforms(platforms)
    prompt=(
        f"im a , {student_status} student. Use websearch so you can compelete the following request : "
        f"i want you to recommend the best {course} course on EACH of the following platforms: {platforms} "
        f"Please return the link for each of the best course of each platform in json format"
        """ here is an example: 
                "Khan Academy": {
                "course_name": "Multivariable Calculus",
                "url": "https://www.khanacademy.org/math/multivariable-calculus"
            }
        """
            )
    response = send_to_api(prompt, api_key)
    urls = parse_urls(response)
    
    return urls


def generate_course(api_key, student_status , course , platforms):
    """
    student_status: a string that describes the student status, like computer science student
    course : common name for course example calculus 3
    platforms : a list of platforms to search in, like udemy, coursera, edx
    """
    urls = get_urls(api_key , student_status , course , platforms)
    modules = []
    for url in urls:
        modules.append(get_modules(api_key, url))
    return modules


async def async_get_modules(api_key, url):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, get_modules, api_key, url)

async def generate_course_async(api_key, student_status, course, platforms):
    urls = get_urls(api_key, student_status, course, platforms)
    
    tasks = [async_get_modules(api_key, url) for url in urls]
    for future in asyncio.as_completed(tasks):
        result = await future
        yield result  # you can stream this to frontend
