#!/usr/bin/env bash
# ==============================================================================
# SmartReply AI - Server Control Script (Start / Stop / Restart / Status / Logs)
# Backend:  Spring Boot on Port 8081
# Frontend: Angular on Port 4201
# ==============================================================================

set -e

# Resolve Project Root Directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$SCRIPT_DIR"

# Ensure common tool directories are in PATH
export PATH="$HOME/.local/bin:$HOME/bin:/usr/local/bin:$PATH"

# Load environment configuration if available
if [ -f "$SCRIPT_DIR/.env" ]; then
    # shellcheck disable=SC2046
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | grep -v '^\s*$' | xargs)
fi

# Port & Configuration Defaults
BACKEND_PORT="${SERVER_PORT:-8081}"
FRONTEND_PORT="${FRONTEND_PORT:-4201}"
SPRING_DATASOURCE_URL="${SPRING_DATASOURCE_URL:-jdbc:postgresql://ep-bold-lake-azagg7zd.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require}"
SPRING_DATASOURCE_USERNAME="${SPRING_DATASOURCE_USERNAME:-neondb_owner}"
SPRING_DATASOURCE_PASSWORD="${SPRING_DATASOURCE_PASSWORD:-npg_N7BLEG3HIneF}"
JWT_SECRET="${JWT_SECRET:-404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}"

# Directories & Files
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
LOGS_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOGS_DIR"

BACKEND_LOG="$LOGS_DIR/backend.log"
FRONTEND_LOG="$LOGS_DIR/frontend.log"
BACKEND_PID_FILE="$LOGS_DIR/backend.pid"
FRONTEND_PID_FILE="$LOGS_DIR/frontend.pid"

# Colors for Terminal Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Helper Functions
get_pids_on_port() {
    local port="$1"
    lsof -ti :"$port" 2>/dev/null || true
}

is_port_in_use() {
    local port="$1"
    nc -z 127.0.0.1 "$port" 2>/dev/null || [ -n "$(get_pids_on_port "$port")" ]
}

kill_process_gracefully() {
    local pid="$1"
    local name="$2"
    if [ -z "$pid" ]; then
        return
    fi

    if kill -0 "$pid" 2>/dev/null; then
        echo -e "${YELLOW}  Stopping $name (PID: $pid)...${NC}"
        kill "$pid" 2>/dev/null || true
        
        # Wait up to 5 seconds for clean exit
        local count=0
        while kill -0 "$pid" 2>/dev/null && [ "$count" -lt 10 ]; do
            sleep 0.5
            count=$((count + 1))
        done

        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${RED}  Force killing $name (PID: $pid)...${NC}"
            kill -9 "$pid" 2>/dev/null || true
        fi
    fi
}

kill_port_processes() {
    local port="$1"
    local name="$2"
    local pids
    pids=$(get_pids_on_port "$port")
    if [ -n "$pids" ]; then
        for pid in $pids; do
            kill_process_gracefully "$pid" "$name on port $port"
        done
    fi
}

# ------------------------------------------------------------------------------
# START Command
# ------------------------------------------------------------------------------
start_backend() {
    echo -e "${BLUE}▶ Starting Backend (Spring Boot on Port $BACKEND_PORT)...${NC}"
    
    if is_port_in_use "$BACKEND_PORT"; then
        local existing_pid
        existing_pid=$(get_pids_on_port "$BACKEND_PORT" | head -n 1)
        echo -e "${YELLOW}  Backend is already running on port $BACKEND_PORT (PID: $existing_pid)${NC}"
        return 0
    fi

    # Start Spring Boot in its own detached session
    (
        cd "$BACKEND_DIR"
        setsid nohup env \
            SERVER_PORT="$BACKEND_PORT" \
            SPRING_DATASOURCE_URL="$SPRING_DATASOURCE_URL" \
            SPRING_DATASOURCE_USERNAME="$SPRING_DATASOURCE_USERNAME" \
            SPRING_DATASOURCE_PASSWORD="$SPRING_DATASOURCE_PASSWORD" \
            JWT_SECRET="$JWT_SECRET" \
            mvn spring-boot:run </dev/null > "$BACKEND_LOG" 2>&1 &
        echo $! > "$BACKEND_PID_FILE"
    )

    echo -n "  Waiting for Backend to initialize"
    local attempts=0
    local max_attempts=40
    local ready=0

    while [ "$attempts" -lt "$max_attempts" ]; do
        if nc -z 127.0.0.1 "$BACKEND_PORT" 2>/dev/null; then
            ready=1
            break
        fi
        echo -n "."
        sleep 1
        attempts=$((attempts + 1))
    done
    echo ""

    if [ "$ready" -eq 1 ]; then
        local pid
        pid=$(get_pids_on_port "$BACKEND_PORT" | head -n 1)
        [ -n "$pid" ] && echo "$pid" > "$BACKEND_PID_FILE"
        echo -e "${GREEN}✓ Backend started successfully!${NC}"
        echo -e "  API URL:     ${CYAN}http://localhost:$BACKEND_PORT${NC}"
        echo -e "  Health:      ${CYAN}http://localhost:$BACKEND_PORT/actuator/health${NC}"
        echo -e "  Log file:    ${BOLD}$BACKEND_LOG${NC}"
    else
        echo -e "${RED}✗ Backend failed to start within $max_attempts seconds.${NC}"
        echo -e "  Check log: ${BOLD}$BACKEND_LOG${NC}"
        tail -n 20 "$BACKEND_LOG"
        return 1
    fi
}

start_frontend() {
    echo -e "${BLUE}▶ Starting Frontend (Angular on Port $FRONTEND_PORT)...${NC}"

    if is_port_in_use "$FRONTEND_PORT"; then
        local existing_pid
        existing_pid=$(get_pids_on_port "$FRONTEND_PORT" | head -n 1)
        echo -e "${YELLOW}  Frontend is already running on port $FRONTEND_PORT (PID: $existing_pid)${NC}"
        return 0
    fi

    # Start Angular in its own detached session
    (
        cd "$FRONTEND_DIR"
        setsid nohup npx ng serve --port "$FRONTEND_PORT" --host 0.0.0.0 </dev/null > "$FRONTEND_LOG" 2>&1 &
        echo $! > "$FRONTEND_PID_FILE"
    )

    echo -n "  Waiting for Frontend to compile and bind"
    local attempts=0
    local max_attempts=40
    local ready=0

    while [ "$attempts" -lt "$max_attempts" ]; do
        if nc -z 127.0.0.1 "$FRONTEND_PORT" 2>/dev/null; then
            ready=1
            break
        fi
        echo -n "."
        sleep 1
        attempts=$((attempts + 1))
    done
    echo ""

    if [ "$ready" -eq 1 ]; then
        local pid
        pid=$(get_pids_on_port "$FRONTEND_PORT" | head -n 1)
        [ -n "$pid" ] && echo "$pid" > "$FRONTEND_PID_FILE"
        echo -e "${GREEN}✓ Frontend started successfully!${NC}"
        echo -e "  App URL:     ${CYAN}http://localhost:$FRONTEND_PORT${NC}"
        echo -e "  Log file:    ${BOLD}$FRONTEND_LOG${NC}"
    else
        echo -e "${RED}✗ Frontend failed to start within $max_attempts seconds.${NC}"
        echo -e "  Check log: ${BOLD}$FRONTEND_LOG${NC}"
        tail -n 20 "$FRONTEND_LOG"
        return 1
    fi
}

start_all() {
    echo -e "${BOLD}${BLUE}====================================================${NC}"
    echo -e "${BOLD}${BLUE}   Starting SmartReply AI (Backend & Frontend)       ${NC}"
    echo -e "${BOLD}${BLUE}====================================================${NC}"
    start_backend
    echo ""
    start_frontend
    echo ""
    echo -e "${BOLD}${GREEN}====================================================${NC}"
    echo -e "${BOLD}${GREEN}   Both services are running and ready!             ${NC}"
    echo -e "   • Frontend: ${CYAN}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "   • Backend:  ${CYAN}http://localhost:$BACKEND_PORT${NC}"
    echo -e "${BOLD}${GREEN}====================================================${NC}"
}

# ------------------------------------------------------------------------------
# STOP Command
# ------------------------------------------------------------------------------
stop_backend() {
    echo -e "${BLUE}▶ Stopping Backend (Port $BACKEND_PORT)...${NC}"
    if [ -f "$BACKEND_PID_FILE" ]; then
        local saved_pid
        saved_pid=$(cat "$BACKEND_PID_FILE" 2>/dev/null || true)
        kill_process_gracefully "$saved_pid" "Backend"
        rm -f "$BACKEND_PID_FILE"
    fi
    kill_port_processes "$BACKEND_PORT" "Backend"
    echo -e "${GREEN}✓ Backend stopped.${NC}"
}

stop_frontend() {
    echo -e "${BLUE}▶ Stopping Frontend (Port $FRONTEND_PORT)...${NC}"
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local saved_pid
        saved_pid=$(cat "$FRONTEND_PID_FILE" 2>/dev/null || true)
        kill_process_gracefully "$saved_pid" "Frontend"
        rm -f "$FRONTEND_PID_FILE"
    fi
    kill_port_processes "$FRONTEND_PORT" "Frontend"
    echo -e "${GREEN}✓ Frontend stopped.${NC}"
}

stop_all() {
    echo -e "${BOLD}${YELLOW}====================================================${NC}"
    echo -e "${BOLD}${YELLOW}   Stopping SmartReply AI Services                  ${NC}"
    echo -e "${BOLD}${YELLOW}====================================================${NC}"
    stop_frontend
    echo ""
    stop_backend
    echo ""
    echo -e "${BOLD}${GREEN}====================================================${NC}"
    echo -e "${BOLD}${GREEN}   All servers stopped successfully.                ${NC}"
    echo -e "${BOLD}${GREEN}====================================================${NC}"
}

# ------------------------------------------------------------------------------
# STATUS Command
# ------------------------------------------------------------------------------
status() {
    echo -e "${BOLD}${CYAN}====================================================${NC}"
    echo -e "${BOLD}${CYAN}   SmartReply AI - Service Status                   ${NC}"
    echo -e "${BOLD}${CYAN}====================================================${NC}"

    # Backend check
    local b_pids
    b_pids=$(get_pids_on_port "$BACKEND_PORT")
    if [ -n "$b_pids" ]; then
        echo -e "Backend:  ${GREEN}[RUNNING]${NC} Port: $BACKEND_PORT | PID(s): $b_pids"
        local health
        health=$(curl -s -m 2 "http://localhost:$BACKEND_PORT/actuator/health" 2>/dev/null || echo "HTTP Error")
        echo -e "          Health: $health"
    else
        echo -e "Backend:  ${RED}[STOPPED]${NC} Port $BACKEND_PORT is free"
    fi

    # Frontend check
    local f_pids
    f_pids=$(get_pids_on_port "$FRONTEND_PORT")
    if [ -n "$f_pids" ]; then
        echo -e "Frontend: ${GREEN}[RUNNING]${NC} Port: $FRONTEND_PORT | PID(s): $f_pids"
        echo -e "          URL: http://localhost:$FRONTEND_PORT"
    else
        echo -e "Frontend: ${RED}[STOPPED]${NC} Port $FRONTEND_PORT is free"
    fi
    echo -e "${BOLD}${CYAN}====================================================${NC}"
}

# ------------------------------------------------------------------------------
# LOGS Command
# ------------------------------------------------------------------------------
show_logs() {
    local target="$1"
    case "$target" in
        backend)
            echo -e "${BLUE}Streaming Backend Logs ($BACKEND_LOG)... (Press Ctrl+C to exit)${NC}"
            tail -n 50 -f "$BACKEND_LOG"
            ;;
        frontend)
            echo -e "${BLUE}Streaming Frontend Logs ($FRONTEND_LOG)... (Press Ctrl+C to exit)${NC}"
            tail -n 50 -f "$FRONTEND_LOG"
            ;;
        *)
            echo -e "${CYAN}=== Last 20 lines of Backend Log ===${NC}"
            tail -n 20 "$BACKEND_LOG" 2>/dev/null || echo "No backend log yet."
            echo ""
            echo -e "${CYAN}=== Last 20 lines of Frontend Log ===${NC}"
            tail -n 20 "$FRONTEND_LOG" 2>/dev/null || echo "No frontend log yet."
            echo ""
            echo -e "Tip: Use ${BOLD}./server.sh logs backend${NC} or ${BOLD}./server.sh logs frontend${NC} to follow logs."
            ;;
    esac
}

# ------------------------------------------------------------------------------
# Main Dispatcher
# ------------------------------------------------------------------------------
case "${1:-}" in
    start)
        start_all
        ;;
    stop)
        stop_all
        ;;
    restart)
        stop_all
        sleep 2
        start_all
        ;;
    status)
        status
        ;;
    logs)
        show_logs "${2:-}"
        ;;
    *)
        echo -e "${BOLD}Usage:${NC} $0 {start|stop|restart|status|logs [backend|frontend]}"
        echo ""
        echo "Commands:"
        echo "  start           Start both Backend (8081) and Frontend (4201)"
        echo "  stop            Stop both Backend and Frontend"
        echo "  restart         Restart both servers"
        echo "  status          Show running status and PIDs of both servers"
        echo "  logs            View recent logs of both servers"
        echo "  logs backend    Stream backend log in real-time"
        echo "  logs frontend   Stream frontend log in real-time"
        exit 1
        ;;
esac
