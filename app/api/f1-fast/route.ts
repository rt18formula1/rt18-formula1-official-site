import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const year = searchParams.get('year');
  const round = searchParams.get('round');

  try {
    // Pythonスクリプトのパス
    const scriptPath = path.join(process.cwd(), 'scripts/f1_data.py');
    
    // コマンドを構築
    let command = `python3 ${scriptPath} --type ${type}`;
    
    if (year) {
      command += ` --year ${year}`;
    }
    
    if (round) {
      command += ` --round ${round}`;
    }

    console.log('Executing FastF1 command:', command);
    
    // Pythonスクリプトを実行
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000, // 30秒タイムアウト
      cwd: process.cwd(),
    });

    if (stderr) {
      console.error('Python stderr:', stderr);
    }

    // 結果をパース
    const result = JSON.parse(stdout);
    
    if (result.error) {
      console.error('FastF1 error:', result.error);
      return NextResponse.json(
        { error: 'FastF1 error', details: result.error },
        { status: 500 }
      );
    }

    console.log(`FastF1 data retrieved successfully for ${type}`);
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error executing FastF1 script:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      if ('code' in error && error.code === 'ENOENT') {
        errorMessage = 'Python script not found. Please ensure Python3 and FastF1 are installed.';
      } else if ('signal' in error && error.signal === 'SIGTERM') {
        errorMessage = 'Script execution timed out. Please try again.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: 'Failed to execute FastF1 script', details: errorMessage },
      { status: 500 }
    );
  }
}
