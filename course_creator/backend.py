import json
def extract_text_from_response(response):
    """
    Extracts the text from the OpenAI RESPONSE API response.
    """
    try:
        r = json.dumps(response.output, default=lambda o: o.__dict__ , indent=2)
        # Parse the JSON string back into a Python dictionary
        json_data = json.loads(r)

        for item in json_data:
            if 'content' in item:
                for content_item in item['content']:
                    if 'text' in content_item:
                        text_content = content_item['text']
                        break

        parts = text_content.split('```')
        if len(parts) >= 3: code_block = parts[1].strip() 
        if code_block.lower().startswith('json'): 
            code_block = code_block[len('json'):].lstrip() 
            result = json.loads(code_block)
            return result
        else: print("No code block found.")
        
    except json.JSONDecodeError as e:   
        raise ValueError(f"Failed to decode JSON: {e}")

    except KeyError as e:
        raise ValueError(f"Invalid response format: {e}")   


def get_urls(response_parsed):
  urls = []
  for r in response_parsed:
      urls.append(response_parsed[r]['url'])
  return urls

from openai import OpenAI
def send_to_api(prompt , api_key):
    
    client = OpenAI(api_key=api_key)

    # Send the prompt to the ChatGPT API
    response = client.responses.create(
        model="gpt-4o",  # or "gpt-3.5-turbo" if you prefer
        input = prompt,
        tools=[
            {
                "type": "web_search"
            }]
    )
    return response
