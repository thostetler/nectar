import type { NextApiRequest, NextApiResponse } from 'next';
import textToSpeech from '@google-cloud/text-to-speech';
import { Buffer } from 'buffer';
import { head } from 'ramda';

export default (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const params = req.body as {
      title: string;
      text: string;
      author: string;
      authorCount: number;
    };

    if (params.text?.length === 0) {
      return res.status(500).json({ error: 'No text provided' });
    }

    const ssml = generateSSML(params);
    const client = new textToSpeech.TextToSpeechClient();
    const request: Parameters<typeof client.synthesizeSpeech>[0] = {
      input: { ssml },
      voice: { languageCode: 'en-GB', ssmlGender: 'FEMALE', name: 'en-GB-Standard-C' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    client.synthesizeSpeech(request, (err, value) => {
      if (err) {
        return res.status(500).json({ error: err });
      }
      const buffer = new Buffer(value.audioContent as string);
      res.json({ blob: buffer.toString('base64') });
    });
  }
};
const generateSSML = (props: { title: string; text: string; author: string; authorCount: number }) => {
  const [last, first] = props.author.split(', ');
  const firstName = first.includes('.')
    ? `
  <say-as interpret-as="characters">
    ${first.replaceAll('.', '').split(' ').map(head).join('')}
  </say-as>`
    : first;
  return `
  <speak>
    ${props.title}
    <break time="500ms"/>
    by ${last} ${firstName} ${props.authorCount > 1 ? `and ${props.authorCount - 1} others` : ''}
    <break time="500ms"/>
    ${props.text}
  </speak>
  `;
};
