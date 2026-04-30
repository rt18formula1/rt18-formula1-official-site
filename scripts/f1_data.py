#!/usr/bin/env python3
"""
FastF1を使用してF1データを取得するPythonスクリプト
"""

import sys
import json
import argparse
from datetime import datetime

try:
    import fastf1
    from fastf1 import get_session, get_event_schedule
    from fastf1.ergast import Ergast
except ImportError:
    print(json.dumps({"error": "FastF1 not installed. Please install with: pip install fastf1"}))
    sys.exit(1)

def get_race_schedule(year=None):
    """レーススケジュールを取得"""
    try:
        if year is None:
            year = datetime.now().year
        
        schedule = get_event_schedule(year)
        races = []
        
        for event in schedule:
            if event.EventFormat == 'conventional':  # 通常のレースのみ
                race_data = {
                    'round': event.RoundNumber,
                    'name': event.EventName,
                    'location': event.Location,
                    'country': event.Country,
                    'circuit': event.CircuitShortName,
                    'date': event.EventDate.strftime('%Y-%m-%d') if event.EventDate else None,
                    'gp_name': event.GrandPrixName,
                    'meeting_key': f"{year}_{event.RoundNumber}",
                }
                races.append(race_data)
        
        return {'races': races}
    except Exception as e:
        return {'error': str(e)}

def get_race_results(year, round_number):
    """特定のレース結果を取得"""
    try:
        session = get_session(year, round_number, 'R')
        session.load()
        
        results = []
        for driver in session.results:
            result_data = {
                'position': driver.Position,
                'driver_number': driver.DriverNumber,
                'driver_name': f"{driver.FirstName} {driver.LastName}",
                'team_name': driver.TeamName,
                'grid_position': driver.GridPosition,
                'status': driver.Status,
                'points': driver.Points,
                'time': str(driver.Time) if driver.Time else None,
            }
            results.append(result_data)
        
        return {'results': results}
    except Exception as e:
        return {'error': str(e)}

def get_driver_info(year, round_number):
    """ドライバー情報を取得"""
    try:
        session = get_session(year, round_number, 'R')
        session.load()
        
        drivers = []
        for driver in session.results:
            driver_data = {
                'driver_number': driver.DriverNumber,
                'first_name': driver.FirstName,
                'last_name': driver.LastName,
                'full_name': f"{driver.FirstName} {driver.LastName}",
                'team_name': driver.TeamName,
                'team_color': driver.TeamColor if hasattr(driver, 'TeamColor') else None,
                'abbreviation': driver.Abbreviation if hasattr(driver, 'Abbreviation') else None,
            }
            drivers.append(driver_data)
        
        return {'drivers': drivers}
    except Exception as e:
        return {'error': str(e)}

def main():
    parser = argparse.ArgumentParser(description='Get F1 data using FastF1')
    parser.add_argument('--type', required=True, choices=['schedule', 'results', 'drivers'], help='Type of data to fetch')
    parser.add_argument('--year', type=int, help='Year (default: current year)')
    parser.add_argument('--round', type=int, help='Round number (for results and drivers)')
    
    args = parser.parse_args()
    
    # FastF1のキャッシュを有効化
    fastf1.Cache.enable_cache('f1_cache')
    
    result = {}
    
    if args.type == 'schedule':
        result = get_race_schedule(args.year)
    elif args.type == 'results':
        if not args.round:
            result = {'error': 'Round number required for results'}
        else:
            result = get_race_results(args.year, args.round)
    elif args.type == 'drivers':
        if not args.round:
            result = {'error': 'Round number required for drivers'}
        else:
            result = get_driver_info(args.year, args.round)
    
    # JSON出力
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
