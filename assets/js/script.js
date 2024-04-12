
var resultText = '';
const search = document.querySelector('#submit');
const searchQuery = document.querySelector('#searchQuery');
const results = document.querySelector('#results');
const difficulty = document.querySelector('#difficulty');
const res_blk = document.querySelector('#res_blk');
const err_blk = document.querySelector('#err_blk');
const loader = document.querySelector('#loader');
const openAiUrl = 'https://api.openai.com/v1/completions';
const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${window.OPEN_AI_KEY}`,
}

search.addEventListener('click', function() {
  if(!searchQuery.value) {return}
  getCompletions();
})

async function getCompletions() {
  let prompt;
  loader.classList.remove('d-none');
  answer.classList.add('d-none');
  res_blk.classList.add('d-none');
  results.innerHTML = null;
  resultText = '';
  err_blk.classList.add('d-none');
  err_blk.innerHTML = null;

  if (difficulty.value == "Easy"){
    prompt = `"""Answer the question if it relates to software or web development or mobile development or programming or UI design only, and question is not related to software or web development or mobile development or programming or UI design or if you're unsure of the answer is related to software or web development or mobile development or programming or UI design, say "Sorry, the question is not related to software".\n\nQ: ${searchQuery.value.replace(/\?/g, '')} in UK English with a simple example\nA:"""`;
  } else {
    prompt = `"""Answer the question if it relates to software or web development or mobile development or programming or UI design only, and question is not related to software or web development or mobile development or programming or UI design or if you're unsure of the answer is related to software or web development or mobile development or programming or UI design, say "Sorry, the question is not related to software".\n\nQ: ${searchQuery.value}${searchQuery.value.slice(-1) === "." ? "" : "."} in software or web development or mobile development or programming or UI design in UK English in technical terms, divided into two paragraphs, principles and applications. Output format, Principle: should be the definition, Application: should be the example.\nA:"""`;
  }

  const data = {
    model: "gpt-3.5-turbo-instruct",
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 500,
    stream: true,
    n: 1,
    prompt
  }

  const dataObj = {
    method: 'POST',
    cache: 'no-cache',
    headers: headers,
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data)
  }

  try {
    const response = await fetch(openAiUrl,dataObj)
    if(!response.ok) { throw await response.json(); }
    res_blk.classList.remove('d-none');
    for await (const measurement of parseJsonStream(response.body)) {
      if(measurement) {
        resultText += measurement.replace(/"/g, '');
        results.textContent = resultText;
      }
    }
  } catch (error) {
    console.log(error);
    err_blk.classList.remove('d-none');
    err_blk.innerHTML = error.error.message;
    answer.classList.remove('d-none');
    loader.classList.add('d-none');
  }

}

  function isJson(str) {
    try {
      return JSON.parse(str)
    } catch (error) {
      return false
    }
  }

  async function *parseJsonStream(readableStream) {
    for await (const line of readLines(readableStream.getReader())) {
        const trimmedLine = line.split('data: ')[1]
        if(isJson(trimmedLine)) {
          yield isJson(trimmedLine).choices[0]?.text
        } else {
          yield ''
        }

    }
}

async function *readLines(reader) {
    const textDecoder = new TextDecoder();
    let partOfLine = '';
    for await (const chunk of readChunks(reader)) {
        const chunkText = textDecoder.decode(chunk);
        const chunkLines = chunkText.split('\n');
        if (chunkLines.length === 1) {
            partOfLine += chunkLines[0];
        } else if (chunkLines.length > 1) {
            yield partOfLine + chunkLines[0];
            for (let i=1; i < chunkLines.length - 1; i++) {
                yield chunkLines[i];
            }
            partOfLine = chunkLines[chunkLines.length - 1];
        }
    }
}

function readChunks(reader) {
    return {
        async* [Symbol.asyncIterator]() {
            let readResult = await reader.read();
            while (!readResult.done) {
                yield readResult.value;
                readResult = await reader.read();
            }
            if(readResult.done) {
              loader.classList.add('d-none');
              answer.classList.remove('d-none');
            }
        },
    };
}

searchQuery.addEventListener('mouseover', function() {
  searchQuery.value = null;
})
